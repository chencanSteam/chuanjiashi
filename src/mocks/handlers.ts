import { authHandlers } from './api/auth'
import { archiveHandlers } from './api/archive'
import { interviewHandlers } from './api/interview'
import { biographyHandlers } from './api/biography'
import { museumHandlers } from './api/museum'
import { digitalPersonHandlers } from './api/digitalPerson'
import { uploadHandlers } from './api/upload'
import { productHandlers } from './api/product'
import { orderHandlers } from './api/order'
import { paymentHandlers } from './api/payment'
import { groupBuyHandlers } from './api/groupBuy'
import { commissionHandlers } from './api/commission'
import { bookshelfHandlers } from './api/bookshelf'
import { biographerHandlers } from './api/biographer'
import { partnerHandlers } from './api/partner'
import { familyHandlers } from './api/family'
import { quotaHandlers } from './api/quota'

export const handlers = [
  ...authHandlers,
  ...archiveHandlers,
  ...interviewHandlers,
  ...biographyHandlers,
  ...museumHandlers,
  ...digitalPersonHandlers,
  ...uploadHandlers,
  ...productHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...groupBuyHandlers,
  ...commissionHandlers,
  ...bookshelfHandlers,
  ...biographerHandlers,
  ...partnerHandlers,
  ...familyHandlers,
  ...quotaHandlers,
]
