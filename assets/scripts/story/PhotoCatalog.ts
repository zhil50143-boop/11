// A small presentation index; all text, assets and completion effects remain in
// the registered story JSON. The core check validates these four references.
export const albumPhotos = [
  { title: '旧毕业照', flag: 'VIEWED_OLD_PHOTO', node: 'CH01_EP02_PHOTO_001', resource: 'data/story/chapter01/ep02_box' },
  { title: '刚洗好的毕业照', flag: 'CH03_SEEN_GRADUATION_PHOTO', node: 'CH03_EP05_PHOTO', resource: 'data/story/chapter03/ep05_graduation_photo' },
  { title: '旧街', flag: 'CH04_SEEN_STREET_PHOTO', node: 'CH04_EP05_PHOTO', resource: 'data/story/chapter04/ep05_summer_days' },
  { title: '楼下合照', flag: 'CH07_SEEN_FAMILY_PHOTO', node: 'CH07_EP08_PHOTO', resource: 'data/story/chapter07/ep08_growing_up' },
] as const;
