import type { StoryTime } from '../core/GameState';

// Static location illustrations are presentation only; they cannot supply story facts.
// Ambiguous places, mixed locations and unsupported times retain the same paper layout.
const eveningNodes = new Set([
  'CH02_EP03_ERRANDS', 'CH04_EP01_ASK', 'CH04_EP01_SET', 'CH04_EP02_LATE',
  'CH04_EP03_MISSING', 'CH04_EP03_WAIT', 'CH04_EP05_CALL',
  'CH08_EP01_N001', 'CH08_EP01_SHARED', 'CH08_EP01_COMMON', 'CH08_EP01_CLOSE',
  'CH08_EP02_N001', 'CH08_EP02_CLOSE', 'CH08_EP03_N001', 'CH08_EP03_READ',
  'CH08_EP03_UNREAD', 'CH08_EP03_CLOSE', 'CH08_EP04_N001', 'CH08_EP04_CLOSE',
  'CH08_EP05_N001', 'CH08_EP05_GRADUATION', 'CH08_EP05_PARTIAL', 'CH08_EP05_CLOSE',
  'CH09_EP01_N001', 'CH09_EP01_SHARED', 'CH09_EP01_COMMON', 'CH09_EP01_DRAFT',
  'CH09_EP01_CONTACT_CHOICE', 'CH09_EP01_INTENT', 'CH09_EP01_UNSENT',
  'CH09_EP02_KNOWN', 'CH09_EP02_NEW_NAME', 'CH09_EP02_DISCLOSE_CHOICE',
  'CH09_EP02_TELL', 'CH09_EP02_WAIT', 'CH09_EP03_HOME', 'CH09_EP06_MET',
  'CH09_EP06_BAG', 'CH10_EP01_HOME', 'CH10_EP02_N001', 'CH10_EP02_PHOTOS',
  'CH10_EP02_EVENING', 'CH10_EP03_ANRAN', 'CH10_EP05_NIGHT',
]);

export function sharedScene(time: StoryTime, nodeId = ''): string | undefined {
  const place = time.location, year = time.year;
  const night = /晚上|晚饭|晚自习|深夜/.test(time.label) || eveningNodes.has(nodeId);
  if (place.includes('→') || place.includes('与')) return undefined;
  if (place === '家中' && year >= 2020) {
    if (nodeId.startsWith('CH01_')) return 'home_2037_v1';
    return night ? 'home_2037_night_v1' : 'home_2037_day_v1';
  }
  if (place === '周叙家' && year >= 2007 && year <= 2013)
    return night ? 'parents_home_night_v1' : 'parents_home_2007_v1';
  if (place === '许知夏家') return undefined;
  if (year >= 2007 && year <= 2009 && place === '17路公交') return 'bus_2007_v1';
  if (year >= 2007 && year <= 2009 && place === '旧体育馆') return night ? undefined : 'gym_2007_v1';
  if (year >= 2007 && year <= 2009 && /^南城二中/.test(place))
    return night || time.season === 'winter' ? undefined : 'school_2007_v1';
  if (year >= 2009 && year <= 2013 && place === '周叙大学宿舍')
    return night ? 'dorm_2009_night_v1' : 'dorm_2009_v1';
  if (year >= 2009 && year <= 2013 && place === '周叙的大学')
    return night || time.season === 'winter' ? undefined : 'campus_2009_v1';
  if (year >= 2011 && year <= 2013 && ['设备厂办公室', '省内设备公司'].includes(place))
    return night ? undefined : 'work_2013_v1';
  if (year === 2037 && place === '单位') return night ? undefined : 'office_current_v1';
  if (year >= 2013 && year <= 2019 && ['工作地出租屋', '出租屋', '新出租屋'].includes(place))
    return night ? undefined : 'rental_2017_v1';
  if (year === 2013 && ['南城车站', '南城车站候车区', '南城车站检票口'].includes(place))
    return night ? undefined : 'station_2013_v2';
  if (year >= 2007 && year <= 2013 && ['照相店', '南城照相店'].includes(place))
    return night ? undefined : 'photo_shop_2007_v2';
  if (year >= 2010 && year <= 2018 && ['南城旧街', '南城街边', '周叙家楼下'].includes(place))
    return night || time.season === 'winter' ? undefined : 'street_2010_v1';
  if (year >= 2012 && year <= 2019 && ['南城小饭店', '面店'].includes(place))
    return night ? undefined : 'diner_2017_v1';
  if (year === 2010 && place === '南城医院') return 'clinic_2010_v1';
  return undefined;
}
