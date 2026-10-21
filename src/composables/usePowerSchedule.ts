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

export type PowerState = 'loading' | 'unavailable' | 'alwaysOn' | 'ready';

const DAY = 1440;
const WEEK = 7 * DAY;

/** Weekdays a job can run on, which are all of them unless the job is weekly. */
export function scheduleWeekdays(schedule: AntivirusSchedule): number[] {
  const index = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(schedule.day);
  return index < 0 ? [1, 2, 3, 4, 5, 6, 7] : [index + 1];
}

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

/** NAS power schedule, loaded on demand through the launcher. */
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
  return { state, load, conflict };
}
