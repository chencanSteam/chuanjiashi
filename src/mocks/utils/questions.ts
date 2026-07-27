import { getItem, setItem, storeKeys } from './store'
import { defaultQuestions } from '../data/seed'
import type { Question } from '../types'

/**
 * 读取采访题库（懒播种：store 为空时写入种子题目）。
 * 采访流程（archive/interview handler）与管理端题库 CRUD 共用同一份数据，
 * 管理端改完题目，用户端采访立即生效。
 */
export function getQuestions(): Question[] {
  const list = getItem<Question[]>(storeKeys.questions, [])
  if (list.length === 0) {
    setItem(storeKeys.questions, defaultQuestions)
    return [...defaultQuestions]
  }
  return list
}

/** 按 order 排序的题库 */
export function getSortedQuestions(): Question[] {
  return getQuestions().slice().sort((a, b) => a.order - b.order)
}
