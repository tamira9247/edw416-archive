// E.DW416 хичээлийн агуулга.
// Сэдэв бүрийн хоосон талбарыг лекцийн материалаас нөхнө.
// Бүх талбар хоосон сэдэвт «Удахгүй нэмэгдэнэ» гэж харагдана.
//
// Сэдвийн талбарууд:
//   title      – сэдвийн нэр (хоосон бол «Сэдэв N»)
//   clo        – сэдвийн CLO (хоосон бол бүлгийн CLO-г харуулна)
//   goal       – сэдвийн зорилго
//   concepts   – гол ойлголтууд: ["...", "..."]
//   lecture    – лекцийн агуулга
//   seminar    – семинарын агуулга
//   references – холбогдох хууль, стандарт: [{ title: "MNS 5140:2026", clause: "4.2" }]

const DATA = {
  chapters: [
    { id: 1, title: "Эрх зүйн зохицуулалт ба баримт бичгийн стандарт", clo: [1, 2, 5] },
    { id: 2, title: "Баримт бичиг боловсруулах арга зүй ба бүртгэл-хяналт", clo: [2, 3, 5] },
    { id: 3, title: "Архив бүрдүүлэлт, цахимжуулалт ба хадгалалт", clo: [1, 4, 5] },
  ],

  topics: [
    // 1-р бүлэг: 1–4-р долоо хоног
    { id: 1,  chapter: 1, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 2,  chapter: 1, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 3,  chapter: 1, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 4,  chapter: 1, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },

    // 2-р бүлэг: 5–10-р долоо хоног
    { id: 5,  chapter: 2, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 6,  chapter: 2, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 7,  chapter: 2, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 8,  chapter: 2, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 9,  chapter: 2, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 10, chapter: 2, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },

    // 3-р бүлэг: 11–16-р долоо хоног
    { id: 11, chapter: 3, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 12, chapter: 3, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 13, chapter: 3, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 14, chapter: 3, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 15, chapter: 3, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
    { id: 16, chapter: 3, title: "", clo: [], goal: "", concepts: [], lecture: "", seminar: "", references: [] },
  ],
};
