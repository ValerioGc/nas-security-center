import { computed, ref } from 'vue';
import { askNasShell } from '@/services/nasShell';
import type { AntivirusSchedule } from '@/types';
import {
  minuteOf,
  offAt,
  offRanges,
  powerWeekdays,
  type PowerSchedule,
} from '@valeriogc/nas-base-app';

/** What is known of the power schedule: still loading, unreadable, never off, or off at times. */
export type PowerState = 'loading' | 'unavailable' | 'alwaysOn' | 'ready';

const DAY = 1440;
const WEEK = 7 * DAY;

/**
 * The weekdays a schedule can fall on: its own for a weekly rule, any of them otherwise, since a
 * day of the month changes weekday from one month to the next.
 */
export function scheduleWeekdays(schedule: AntivirusSchedule): number[] {
  const index = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(schedule.day);
  return index < 0 ? [1, 2, 3, 4, 5, 6, 7] : [index + 1];
}

/** Warn about a shutdown or restart within 30 minutes, including across midnight/week end. */
export function stopsSoon(
  schedule: PowerSchedule | null,
  weekdays: number[],
  minute: number,
): boolean {
  return Boolean(
    schedule?.enabled &&
    schedule.rules.some(
      (rule) =>
        rule.action !== 'start' &&
        powerWeekdays[rule.day].some((day) =>
          weekdays.some((weekday) => {
            const distance =
              ((day - weekday) * DAY + (minuteOf(rule.time) ?? 0) - minute + WEEK) % WEEK;
            return distance <= 30;
          }),
        ),
    ),
  );
}

/** The power schedule of the NAS, read through the launcher once it is needed. */
export function usePowerSchedule() {
  const schedule = ref<PowerSchedule | null>(null);
  const loaded = ref(false);
  const loading = ref(false);
  const failed = ref(false);
  const ranges = computed(() => offRanges(schedule.value));
  const state = computed<PowerState>(() => {
    if (!loaded.value) {
      return 'loading';
    }
    if (failed.value) {
      return 'unavailable';
    }
    return ranges.value.some((day) => day.length > 0) ? 'ready' : 'alwaysOn';
  });
  // Shutdowns without any start: the NAS waits to be switched on by hand.
  const manualStart = computed(
    () => state.value === 'ready' && !schedule.value?.rules.some((rule) => rule.action === 'start'),
  );

  async function load() {
    if (loading.value) {
      return;
    }
    loading.value = true;
    try {
      const answer = await askNasShell<PowerSchedule>('power-schedule');
      if (
        !answer ||
        typeof answer.enabled !== 'boolean' ||
        !Array.isArray(answer.rules) ||
        answer.rules.some(
          (rule) =>
            !rule ||
            !(rule.day in powerWeekdays) ||
            minuteOf(rule.time) === null ||
            !['start', 'shutdown', 'restart'].includes(rule.action),
        )
      ) {
        throw new Error('Invalid power schedule');
      }
      schedule.value = answer;
      failed.value = false;
    } catch {
      schedule.value = null;
      failed.value = true;
    }
    loaded.value = true;
    loading.value = false;
  }

  function conflict(job: AntivirusSchedule): 'off' | 'soon' | null {
    const minute = minuteOf(job.time);
    if (minute === null || !job.enabled) {
      return null;
    }
    const weekdays = scheduleWeekdays(job);
    if (offAt(ranges.value, weekdays, minute).length) {
      return 'off';
    }
    return stopsSoon(schedule.value, weekdays, minute) ? 'soon' : null;
  }
  return { ranges, state, manualStart, load, conflict };
}
