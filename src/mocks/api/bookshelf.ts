import { http, type HttpHandler } from 'msw'
import { success, unauthorized, notFound } from '../utils/response'
import { getItem, setItem, generateId, storeKeys } from '../utils/store'
import type { PublicBook, Biography, BiographyChapter, Archive } from '../types'

function getCurrentUserId(): string | null {
  const user = getItem<{ id: string } | null>(storeKeys.currentUser, null)
  return user?.id || null
}

function getDefaultPublicBooks(): PublicBook[] {
  return [
    {
      id: 'book_demo_001',
      archiveId: 'default',
      userId: 'u_demo_001',
      title: '张明远：一位苏州企业家的六十年',
      author: 'AI 整理',
      intro: '从苏州老巷到创业舞台，记录一个普通中国家庭的奋斗与传承。',
      category: '企业家',
      price: 0,
      isFree: true,
      status: 'approved',
      views: 1280,
      likes: 86,
      collects: 42,
      shares: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book_demo_002',
      archiveId: 'default2',
      userId: 'u_demo_002',
      title: '山村教师王桂芬',
      author: '家属整理',
      intro: '四十年讲台生涯，用知识点亮山村孩子的未来。',
      category: '教师',
      price: 9.9,
      isFree: false,
      status: 'approved',
      views: 560,
      likes: 34,
      collects: 12,
      shares: 8,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book_demo_003',
      archiveId: 'default3',
      userId: 'u_demo_003',
      title: '医者仁心：李华亭回忆录',
      author: '家属整理',
      intro: '从赤脚医生到三甲医院专家，五十载悬壶济世的动人故事。',
      category: '医生',
      price: 19.9,
      isFree: false,
      status: 'pending',
      views: 0,
      likes: 0,
      collects: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'book_demo_004',
      archiveId: 'default4',
      userId: 'u_demo_004',
      title: '我的母亲周秀英',
      author: 'AI 整理',
      intro: '一位普通农村母亲养育五个子女的艰辛与慈爱。',
      category: '其他',
      price: 0,
      isFree: true,
      status: 'pending',
      views: 0,
      likes: 0,
      collects: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
    },
  ]
}

function generateDemoChapterContent(title: string, name: string, category: string): string {
  const templates: Record<string, string[]> = {
    前言: [
      `写下${name}的故事，并非为了渲染传奇，而是希望在时光的长河中，为家人、为后代留存一份真实而温暖的记忆。${name}的一生，与这个国家普通人的命运紧紧相连，经历了动荡、奋斗、欢笑与泪水，也见证了时代的变迁与家庭的延续。`,
      `本书以${category}的视角，从${name}的童年说起，穿过求学的青涩、工作的繁忙、创业的艰辛、家庭的温馨，直至人生的沉淀与感悟。每一章都力求真实还原那些难忘的瞬间，让阅读者能够感受到一个有血有肉、有情有义的生命历程。`,
      `在前言里，我们想特别感谢参与整理的家人们。正是因为你们的讲述、回忆与珍藏，才让这段历史得以重见天日。希望这本书能成为家族传承的一部分，让${name}的精神与家风，代代相传。`,
      `传记不仅是个人记忆的存档，更是一个家庭共同的精神财富。透过文字，我们能够触摸到先辈的体温，聆听到那个时代的心跳，感受到跨越岁月的亲情力量。`,
    ],
    童年记忆: [
      `${name}的童年，是在一片江南水乡的老宅中度过的。清晨的薄雾、巷口的叫卖声、祖母手工制作的点心，构成了记忆中最温暖的底色。那时的日子虽然清苦，却充满了人情味。`,
      `家中兄弟姐妹众多，${name}排行中间，从小就学会了分担与谦让。父亲严厉而正直，母亲温柔而坚韧，他们的言传身教，深深影响了${name}日后的为人处世。`,
      `童年最难忘的事，莫过于每年春节全家团聚。那一桌丰盛的年夜饭，那一声声鞭炮，那一张张笑脸，成为${name}心中最珍贵的年节记忆，也让${name}对家庭有着格外的眷恋。`,
      `夏天的夜晚，一家人常常坐在院子里乘凉。${name}喜欢听祖父讲述过去的故事，那些关于家族、关于乡土、关于坚持的故事，像种子一样埋进了${name}幼小的心田。`,
    ],
    求学岁月: [
      `${name}的求学之路并不平坦。那时候学校条件简陋，课本稀缺，但年轻的${name}始终保持着对知识的渴望。每天天不亮就起床读书，夜晚在煤油灯下复习，是那段岁月最真实的写照。`,
      `在中学时期，${name}遇到了几位影响深远的老师。他们不仅传授知识，更教会了${name}如何做人、如何面对困难。${name}常说，正是这些老师的鼓励，才让${name}坚定了继续求学的信念。`,
      `高中毕业后，${name}以优异的成绩考入了理想的学校。离开家乡的那一天，母亲塞给${name}一包干粮，父亲只说了一句："出门在外，要堂堂正正做人。"这句话，${name}记了一辈子。`,
      `大学时光开阔了${name}的眼界，也锻炼了${name}独立生活的能力。课余时间，${name}常常去图书馆读书，参加社团活动，结交志同道合的朋友，这些都为日后的人生道路打下了坚实的基础。`,
    ],
    工作经历: [
      `走出校门后，${name}被分配到一家国营单位工作。初入职场的${name}踏实肯干，虚心向老同事请教，很快就在岗位上崭露头角。那些年，${name}常常加班到深夜，却从未抱怨。`,
      `在工作中，${name}始终坚持原则，敢于承担责任。有一次，单位面临一项紧急任务，许多人都退缩了，${name}主动请缨，带领团队连续奋战数日，最终圆满完成了任务，赢得了大家的尊重。`,
      `随着经验的积累，${name}逐渐从普通员工成长为业务骨干。无论职位如何变化，${name}始终保持着谦逊的态度和对工作的热爱，也用实际行动影响着身边的年轻人。`,
      `${name}特别重视团队协作，常说"一个人走得快，一群人走得远"。在${name}的带领下，团队形成了互帮互助、共同进步的良好氛围，多次被评为先进集体。`,
    ],
    创业之路: [
      `改革开放的春风吹来，${name}敏锐地察觉到时代的变化。经过深思熟虑，${name}毅然决定辞去稳定的工作，投身商海。创业之初，资金短缺、人脉匮乏，每一步都走得异常艰难。`,
      `为了节省开支，${name}常常一个人身兼数职，白天跑业务，晚上做账。最难的时候，连员工的工资都发不出来，但${name}没有放弃，而是咬牙坚持，一点点打开了局面。`,
      `经过多年的打拼，${name}的事业终于步入正轨。回首创业路，${name}最感慨的不是财富的增长，而是学会了在困境中保持信念，在成功后不忘本心。这份经历，也成为家族后代最宝贵的精神财富。`,
      `${name}始终坚信，做生意先做人。无论面对客户还是合作伙伴，${name}都坚持诚信为本、互利共赢。正是这份坚守，让${name}赢得了良好的口碑，也为事业的长远发展奠定了根基。`,
    ],
    家庭生活: [
      `${name}与伴侣的相识，源于一次偶然的相遇。两人志趣相投，携手走过了几十个春秋。无论是顺境还是逆境，他们始终相互扶持，共同经营着这个温暖的家。`,
      `作为父母，${name}对子女既严格又慈爱。在子女的记忆中，${name}很少说教，更多的是以身作则。每当孩子们遇到困难，${name}总是耐心倾听，给予建议，而不是简单地批评。`,
      `家庭聚餐是${name}最看重的时刻。每逢周末或节假日，${name}总会亲自下厨，做几道拿手菜，看着一家人围坐在一起，说说笑笑，${name}觉得这就是最大的幸福。`,
      `${name}还十分关心家族中的晚辈成长。逢年过节，${name}总会抽出时间与大家谈心，分享自己的经历与感悟，鼓励年轻人勇敢追梦、踏实前行。`,
    ],
    人生感悟: [
      `年过花甲，${name}对人生有了更深的体悟。${name}常说，人的一生不在于拥有多少财富，而在于是否活得真实、是否对他人有所帮助。这份豁达，源于岁月的沉淀，也源于对生活的热爱。`,
      `回顾走过的路，${name}最骄傲的不是事业上的成就，而是培养了一群正直善良的后代。看到孩子们各有所成，家庭和睦，${name}感到所有的付出都是值得的。`,
      `${name}也经历过失去与遗憾，但这些并没有让${name}消沉。相反，${name}更加珍惜眼前的人与事，更加懂得感恩。在${name}看来，每一个平凡的日子，都是生命最好的馈赠。`,
      `${name}常常叮嘱后辈：要心怀善念，脚踏实地；要孝敬父母，友爱兄弟；要在自己的能力范围内，多为社会做贡献。这些朴素的话语，凝聚着${name}一生最珍贵的智慧。`,
    ],
    后记: [
      `写到这里，${name}的故事暂告一段落，但生命的延续从未停止。这本书所记录的，只是一个缩影，更多精彩的故事，仍在家人之间的口耳相传中继续。`,
      `我们希望，未来的日子里，后代们能够时常翻开这本书，重温先辈的足迹，感受那份跨越时空的温暖与力量。无论走到哪里，家的根脉都不会断。`,
      `最后，愿${name}健康长寿，也愿这个家庭的每一位成员，都能继承先辈的优良家风，正直做人、踏实做事，把这份珍贵的精神财富，一代一代传下去。`,
      `岁月无声，文字有温度。愿这本书成为家族记忆的一部分，也成为后代前行路上的一盏明灯，照亮他们的人生方向。`,
    ],
  }

  const paragraphs = templates[title] || [
    `${name}的人生故事，以朴实纪实的笔触徐徐展开。本章记录了${name}在${title}阶段的珍贵回忆与生活细节。`,
    `从家庭环境到时代背景，从个人抉择到心路历程，每一个细节都承载着岁月的痕迹，也折射出那一代人共同的生命体验。`,
    `通过家人的讲述与资料的整理，我们得以窥见${name}真实而丰富的一面，感受到一个有温度、有故事的生命。`,
  ]

  return `${title}\n\n${paragraphs.map((p) => `    ${p}`).join('\n\n')}`
}

function ensureDemoBiographies(books: PublicBook[]): void {
  const existing = getItem<Biography[]>(storeKeys.biographies, [])
  const biographies = Array.isArray(existing) ? existing : []
  const archives = getItem<Archive[]>(storeKeys.archives, [])

  books.forEach((book) => {
    if (biographies.some((b) => b.archiveId === book.archiveId)) return

    const name = archives.find((a) => a.id === book.archiveId)?.name || book.title.slice(0, 6)
    const chapterTitles = ['前言', '童年记忆', '求学岁月', '工作经历', '创业之路', '家庭生活', '人生感悟', '后记']
    const chapters: BiographyChapter[] = chapterTitles.map((title, idx) => ({
      id: generateId(),
      order: idx,
      title,
      content: generateDemoChapterContent(title, name, book.category),
      images: [],
    }))

    biographies.push({
      id: generateId(),
      archiveId: book.archiveId,
      title: book.title,
      style: 'plain',
      wordCount: 'standard',
      chapters,
      status: 'final',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  setItem(storeKeys.biographies, biographies)
}

function ensureBooks(): PublicBook[] {
  const books = getItem<PublicBook[]>(storeKeys.publicBooks, [])
  if (books.length === 0) {
    const defaults = getDefaultPublicBooks()
    setItem(storeKeys.publicBooks, defaults)
    ensureDemoBiographies(defaults)
    return defaults
  }
  return books
}

export const bookshelfHandlers: HttpHandler[] = [
  http.get('/api/bookshelf', async ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category') || ''
    const keyword = url.searchParams.get('keyword') || ''
    let books = ensureBooks().filter((b) => b.status === 'approved')
    if (category) books = books.filter((b) => b.category === category)
    if (keyword) {
      const lower = keyword.toLowerCase()
      books = books.filter((b) =>
        b.title.toLowerCase().includes(lower) || b.author.toLowerCase().includes(lower)
      )
    }
    return success(books)
  }),

  http.get('/api/bookshelf/:id', async ({ params }) => {
    const books = ensureBooks()
    const book = books.find((b) => b.id === params.id)
    if (!book) return notFound('传记不存在')
    book.views += 1
    setItem(storeKeys.publicBooks, books)
    return success(book)
  }),

  http.post('/api/bookshelf/:id/like', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const books = ensureBooks()
    const book = books.find((b) => b.id === params.id)
    if (!book) return notFound('传记不存在')
    book.likes += 1
    setItem(storeKeys.publicBooks, books)
    return success(book)
  }),

  http.post('/api/bookshelf/:id/collect', async ({ params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const books = ensureBooks()
    const book = books.find((b) => b.id === params.id)
    if (!book) return notFound('传记不存在')
    book.collects += 1
    setItem(storeKeys.publicBooks, books)
    return success(book)
  }),

  http.post('/api/bookshelf/:id/publish', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const books = ensureBooks()
    const body = (await request.json()) as Partial<PublicBook>
    const idx = books.findIndex((b) => b.id === params.id && b.userId === userId)
    if (idx < 0) {
      const book: PublicBook = {
        id: params.id as string,
        archiveId: body.archiveId || '',
        userId,
        title: body.title || '未命名传记',
        author: body.author || '匿名',
        intro: body.intro || '',
        category: body.category || '其他',
        price: body.price ?? 0,
        isFree: body.isFree ?? true,
        status: 'pending',
        views: 0,
        likes: 0,
        collects: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
      }
      books.push(book)
      setItem(storeKeys.publicBooks, books)
      return success(book, '提交审核成功')
    }
    books[idx] = { ...books[idx], ...body, status: 'pending' }
    setItem(storeKeys.publicBooks, books)
    return success(books[idx], '更新成功')
  }),

  http.get('/api/my-bookshelf', async () => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const books = ensureBooks().filter((b) => b.userId === userId)
    return success(books)
  }),

  http.get('/api/admin/bookshelf', async ({ request }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    const keyword = url.searchParams.get('keyword') || ''
    let books = ensureBooks()
    if (status !== 'all') books = books.filter((b) => b.status === status)
    if (keyword) {
      const lower = keyword.toLowerCase()
      books = books.filter((b) =>
        b.title.toLowerCase().includes(lower) || b.author.toLowerCase().includes(lower)
      )
    }
    return success(books)
  }),

  http.put('/api/admin/bookshelf/:id/review', async ({ request, params }) => {
    const userId = getCurrentUserId()
    if (!userId) return unauthorized()
    const books = ensureBooks()
    const idx = books.findIndex((b) => b.id === params.id)
    if (idx < 0) return notFound('传记不存在')
    const { status, reason } = (await request.json()) as { status: PublicBook['status']; reason?: string }
    if (!['approved', 'rejected', 'off_shelf'].includes(status)) {
      return notFound('无效状态')
    }
    books[idx] = { ...books[idx], status }
    if (reason) {
      // 可以扩展 PublicBook 类型添加 reason 字段，这里暂不保存
    }
    setItem(storeKeys.publicBooks, books)
    return success(books[idx], status === 'approved' ? '审核通过' : status === 'rejected' ? '已拒绝' : '已下架')
  }),
]
