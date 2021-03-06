import { SET_IS_VISIBLE, SET_MESSAGE, SET_TYPE } from './constants'

export function setIsVisible(isVisible) {
  return { type: SET_IS_VISIBLE, isVisible }
}

export function setMessage(message) {
  return { type: SET_MESSAGE, message }
}

export function setType(notificationType) {
  return { type: SET_TYPE, notificationType }
}
