// Utility functions untuk menangani jadwal kelompok ronda

export function getTodayDayName(): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = new Date();
  return days[today.getDay()];
}

export function isScheduledToday(jadwalHari: string | null | undefined): boolean {
  if (!jadwalHari) return false;
  
  const today = getTodayDayName();
  const schedule = jadwalHari.toLowerCase();
  const todayLower = today.toLowerCase();
  
  // Handle different schedule formats
  if (schedule.includes(' - ')) {
    // Format: "Senin - Rabu" atau "Kamis - Sabtu"
    const [startDay, endDay] = schedule.split(' - ').map(day => day.trim());
    
    const dayOrder = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const todayIndex = dayOrder.indexOf(todayLower);
    const startIndex = dayOrder.indexOf(startDay.toLowerCase());
    const endIndex = dayOrder.indexOf(endDay.toLowerCase());
    
    if (startIndex === -1 || endIndex === -1 || todayIndex === -1) {
      return false;
    }
    
    // Handle wrap-around schedules (e.g., Sabtu - Senin)
    if (startIndex <= endIndex) {
      return todayIndex >= startIndex && todayIndex <= endIndex;
    } else {
      return todayIndex >= startIndex || todayIndex <= endIndex;
    }
  } else {
    // Single day format: "Sabtu", "Minggu", etc.
    return schedule === todayLower;
  }
}

export function parseScheduleRange(jadwalHari: string): { startDay: string; endDay: string } | null {
  if (!jadwalHari) return null;
  
  if (jadwalHari.includes(' - ')) {
    const [startDay, endDay] = jadwalHari.split(' - ').map(day => day.trim());
    return { startDay, endDay };
  } else {
    // Single day schedule
    return { startDay: jadwalHari.trim(), endDay: jadwalHari.trim() };
  }
}

export function formatScheduleDisplay(jadwalHari: string | null | undefined): string {
  if (!jadwalHari) return 'Tidak ada jadwal';
  
  const today = getTodayDayName();
  const isToday = isScheduledToday(jadwalHari);
  
  if (isToday) {
    return `${jadwalHari} (Hari ini)`;
  } else {
    return jadwalHari;
  }
}