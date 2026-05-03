import { and, eq } from "drizzle-orm";
import { google } from "googleapis";
import { DateTime } from "luxon";
import { z } from "zod";
import { config } from "../config";
import { db } from "../db";
import { users } from "../db/schema";
import { AppError } from "../types";
import { createOAuth2Client } from "./google.service";

const freeSlotSchema = z.object({
  interviewerEmail: z.string().email(),
  date: z.string(),
  durationMinutes: z.number().int().positive().optional(),
});

async function getUserByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  if (!user) {
    throw new AppError("Interviewer not found", 404);
  }

  return user;
}

async function getCalendarAuth(email: string) {
  const user = await getUserByEmail(email);
  const auth = createOAuth2Client({
    accessToken: user.googleAccessToken,
    refreshToken: user.googleRefreshToken,
  });

  auth.on("tokens", async (tokens) => {
    await db
      .update(users)
      .set({
        googleAccessToken: tokens.access_token || user.googleAccessToken,
        googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  });

  await auth.getAccessToken();
  return google.calendar({ version: "v3", auth });
}

function calculateFreeWindows(
  busyBlocks: Array<{ start: string; end: string; summary: string }>,
  date: string,
  timezone: string,
  durationMinutes: number,
) {
  const workStart = config.scheduling.workDayStartHour;
  const workEnd = config.scheduling.workDayEndHour;
  const increment = config.scheduling.freeSlotIncrementMinutes;
  const buffer = config.scheduling.freeSlotBufferMinutes;

  const day = DateTime.fromISO(date, { zone: timezone });
  const startBoundary = day.set({
    hour: workStart,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const endBoundary = day.set({
    hour: workEnd,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  // Filter busy blocks to only those that overlap with our work day
  const relevantBusy = busyBlocks
    .map((block) => {
      // Handle all-day events (date only) by making them span the whole day in the timezone
      const start = block.start.includes("T")
        ? DateTime.fromISO(block.start, { zone: timezone })
        : DateTime.fromISO(block.start, { zone: timezone }).startOf("day");

      const end = block.end.includes("T")
        ? DateTime.fromISO(block.end, { zone: timezone })
        : DateTime.fromISO(block.end, { zone: timezone }).endOf("day");

      return { start, end };
    })
    .filter((block) => {
      return block.start < endBoundary && block.end > startBoundary;
    })
    .sort((a, b) => a.start.toMillis() - b.start.toMillis());

  const freeSlots: Array<{ start: string; end: string }> = [];
  let pointer = startBoundary;
  const now = DateTime.now().setZone(timezone).plus({ minutes: buffer });

  for (const block of relevantBusy) {
    while (pointer.plus({ minutes: durationMinutes }) <= block.start) {
      if (pointer >= now) {
        freeSlots.push({
          start: pointer.toISO() || "",
          end: pointer.plus({ minutes: durationMinutes }).toISO() || "",
        });
      }
      pointer = pointer.plus({ minutes: increment });
    }

    if (block.end > pointer) {
      pointer = block.end;
      // Round up pointer to next increment if it's not aligned
      const minutes = pointer.minute;
      const remainder = minutes % increment;
      if (remainder !== 0) {
        pointer = pointer
          .plus({ minutes: increment - remainder })
          .set({ second: 0, millisecond: 0 });
      }
    }
  }

  while (pointer.plus({ minutes: durationMinutes }) <= endBoundary) {
    if (pointer >= now) {
      freeSlots.push({
        start: pointer.toISO() || "",
        end: pointer.plus({ minutes: durationMinutes }).toISO() || "",
      });
    }
    pointer = pointer.plus({ minutes: increment });
  }

  return freeSlots;
}

export const calendarService = {
  getCalendarClientForEmail: async (email: string) => getCalendarAuth(email),

  getTimezone: async (interviewerEmail: string) => {
    try {
      const cal = await getCalendarAuth(interviewerEmail);
      const tzSetting = await cal.settings.get({ setting: "timezone" });
      return tzSetting.data.value || "UTC";
    } catch (err) {
      console.error("Failed to get timezone for", interviewerEmail, err);
      return "UTC";
    }
  },

  getFreeSlots: async (
    interviewerEmail: string,
    date: string,
    durationMinutes = config.scheduling.defaultInterviewDurationMinutes,
  ) => {
    freeSlotSchema.parse({ interviewerEmail, date, durationMinutes });

    const timezone = await calendarService.getTimezone(interviewerEmail);
    const cal = await getCalendarAuth(interviewerEmail);

    const startOfDay = DateTime.fromISO(date, { zone: timezone })
      .startOf("day")
      .toISO();
    const endOfDay = DateTime.fromISO(date, { zone: timezone })
      .endOf("day")
      .toISO();

    const events = await cal.events.list({
      calendarId: "primary",
      timeMin: startOfDay || undefined,
      timeMax: endOfDay || undefined,
      singleEvents: true,
      orderBy: "startTime",
    });

    const busyBlocks =
      events.data.items
        ?.filter((event) => event.status !== "cancelled")
        .map((event) => ({
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          summary: event.summary || "Busy",
        }))
        .filter((event) => event.start && event.end) || [];

    const freeSlots = calculateFreeWindows(
      busyBlocks,
      date,
      timezone,
      durationMinutes,
    );

    return {
      interviewerEmail,
      date,
      timezone,
      workHours: `${config.scheduling.workDayStartHour}:00 - ${config.scheduling.workDayEndHour}:00`,
      freeSlots,
      busyCount: busyBlocks.length,
    };
  },
};
