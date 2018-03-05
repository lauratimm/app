import { all, call, put, select, takeLatest } from 'redux-saga/effects'

import { setSendingRequest } from '../App/actions'
import {
  setType as setNotificationType,
  setIsVisible as setNotificationIsVisible
} from '../Notification/actions'
import { finishProgress, startProgress } from '../ProgressBar/actions'
import { signOutEndpoint } from '../../api/authentication'
import { leaveMapathonEndpoint } from '../../api/mapathons'
import { editPetitionEndpoint, getPetitionsEndpoint } from '../../api/petitions'
import appSelector from '../App/selector'
import { leaveTeamEndpoint } from '../../api/teams'
import { editUserEndpoint, getUserEndpoint } from '../../api/users'

import {
  setEditIsVisible,
  setErrors,
  setLoadingUser,
  setNotificationMessage,
  setUser,
  clearPetitionsState,
  setLoadingPetitions,
  setNextPage,
  setPetitions,
  addPetitions,
  removePetition,
  changePetitionState
} from './actions'
import {
  EDIT_USER,
  GET_USER,
  LEAVE_MAPATHON,
  LEAVE_TEAM,
  GET_PETITIONS,
  EDIT_PETITION,
  SIGN_OUT
} from './constants'
import userSelector from './selector'

function* showNotificationError(message) {
  yield put(setNotificationType('error'))
  yield put(setNotificationMessage(message))
  yield put(setNotificationIsVisible(true))
  yield put(finishProgress())
  yield put(setSendingRequest(false))
}

function* getUserFlow(params) {
  const sendingRequest = yield select(appSelector('sendingRequest'))
  if (sendingRequest) {
    return
  }

  yield put(startProgress())
  yield put(setSendingRequest(true))

  let response
  try {
    response = yield call(getUserEndpoint, params.userId)
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      yield showNotificationError('timeoutError')
    } else if (error.response.status === 500) {
      yield showNotificationError('serverError')
    } else if (error.response.data.general === 'User not found') {
      yield showNotificationError('notFoundError')
    }

    yield put(setLoadingUser(false))
    return
  }

  yield put(setUser(response.data))

  yield put(finishProgress())
  yield put(setSendingRequest(false))
  yield put(setLoadingUser(false))
}

function* leaveTeamFlow({ teamId }) {
  const sendingRequest = yield select(appSelector('sendingRequest'))
  if (sendingRequest) {
    return
  }

  yield put(startProgress())
  yield put(setSendingRequest(true))

  try {
    yield call(leaveTeamEndpoint, teamId)
  } catch (err) {
    yield put(setNotificationType('error'))
    if (err.code === 'ECONNABORTED') {
      yield put(setNotificationMessage('timeoutError'))
    } else if (err.response.status === 500) {
      yield put(setNotificationMessage('serverError'))
    } else if (err.response.status === 401) {
      return
    } else if (err.response.status === 423) {
      yield put(setNotificationMessage('blockedError'))
    } else if (
      err.response.data.general ===
      'You cannot leave because you are the only manager'
    ) {
      yield put(setNotificationMessage('onlyManagerError'))
    } else if (err.response.data.general === 'You are not a member') {
      yield put(setNotificationMessage('notMemberError'))
    }
    yield put(setNotificationIsVisible(true))

    yield put(finishProgress())
    yield put(setSendingRequest(false))

    return
  }

  const user = yield select(userSelector('user'))
  const userTeams = user.teams.filter(t => t.id !== teamId)
  yield put(setUser({ ...user, teams: userTeams }))

  yield put(finishProgress())
  yield put(setSendingRequest(false))

  yield put(setNotificationType('success'))
  yield put(setNotificationMessage('leaveTeamSuccess'))
  yield put(setNotificationIsVisible(true))
}

function* leaveMapathonFlow({ mapathonId }) {
  const sendingRequest = yield select(appSelector('sendingRequest'))
  if (sendingRequest) {
    return
  }

  yield put(startProgress())
  yield put(setSendingRequest(true))

  try {
    yield call(leaveMapathonEndpoint, mapathonId)
  } catch (err) {
    yield put(setNotificationType('error'))
    if (err.code === 'ECONNABORTED') {
      yield put(setNotificationMessage('timeoutError'))
    } else if (err.response.status === 500) {
      yield put(setNotificationMessage('serverError'))
    } else if (err.response.status === 401) {
      return
    } else if (err.response.status === 423) {
      yield put(setNotificationMessage('blockedError'))
    } else if (
      err.response.data.general === 'You cannot leave because it already ended'
    ) {
      yield put(setNotificationMessage('mapathonEndedError'))
    } else if (
      err.response.data.general ===
      'You cannot leave because you are the only manager'
    ) {
      yield put(setNotificationMessage('onlyManagerError'))
    } else if (err.response.data.general === 'You are not a participant') {
      yield put(setNotificationMessage('notParticipantError'))
    }
    yield put(setNotificationIsVisible(true))

    yield put(finishProgress())
    yield put(setSendingRequest(false))

    return
  }

  const user = yield select(userSelector('user'))
  const userMapathons = user.events.filter(e => e.id !== mapathonId)
  yield put(setUser({ ...user, events: userMapathons }))

  yield put(finishProgress())
  yield put(setSendingRequest(false))

  yield put(setNotificationType('success'))
  yield put(setNotificationMessage('leaveMapathonSuccess'))
  yield put(setNotificationIsVisible(true))
}

function* editUserFlow({ data }) {
  const sendingRequest = yield select(appSelector('sendingRequest'))
  if (sendingRequest) {
    return
  }

  yield put(startProgress())
  yield put(setSendingRequest(true))

  let userAvatar
  if (data.avatar && !data.avatar.startsWith('https://')) {
    userAvatar = data.avatar
  } else if (data.avatar === '') {
    userAvatar = ''
  }

  const userData = {
    ...data,
    avatar: userAvatar,
    events: undefined,
    teams: undefined
  }

  const user = yield select(userSelector('user'))
  const userId = user.id
  try {
    yield call(editUserEndpoint, userId, userData)
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      yield showNotificationError('timeoutError')
      return
    } else if (err.response.status === 500) {
      yield showNotificationError('serverError')
      return
    } else if (err.response.status === 401) {
      yield put(finishProgress())
      yield put(setSendingRequest(false))
      return
    } else if (err.response.status === 423) {
      yield showNotificationError('blockedError')
      return
    } else if (err.response.status === 403) {
      yield showNotificationError('forbiddenError')
      return
    }

    const errors = err.response.data
    yield all(Object.keys(errors).map(key => put(setErrors(key, errors[key]))))

    yield put(finishProgress())
    yield put(setSendingRequest(false))

    return
  }

  yield put(finishProgress())
  yield put(setSendingRequest(false))

  yield put(setEditIsVisible(false))
  yield put(setLoadingUser(true))
  yield call(getUserFlow, {
    userId
  })
}

function* signOutFlow() {
  const sendingRequest = yield select(appSelector('sendingRequest'))
  if (sendingRequest) {
    return
  }

  yield put(setSendingRequest(true))
  yield put(startProgress())

  try {
    yield call(signOutEndpoint)
  } finally {
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('token')

    yield put(setSendingRequest(false))
    yield put(finishProgress())

    location.reload()
  }
}

function* finishAndClearState() {
  yield put(clearPetitionsState())
  yield put(finishProgress())
  yield put(setSendingRequest(false))
  yield put(setLoadingPetitions(false))
}

function* getPetitionsFlow() {
  const sendingRequest = yield select(appSelector('sendingRequest'))
  if (sendingRequest) {
    return
  }

  yield put(setSendingRequest(true))
  yield put(startProgress())

  const filter = yield select(userSelector('filter'))
  const nextPage = yield select(userSelector('nextPage'))
  const getPetitionsParams = {
    page: nextPage,
    filter
  }

  let response
  try {
    response = yield call(getPetitionsEndpoint, getPetitionsParams)
  } catch (error) {
    yield put(setNotificationType('error'))
    if (error.code === 'ECONNABORTED') {
      yield put(setNotificationMessage('timeoutError'))
    } else {
      yield put(setNotificationMessage('serverError'))
    }
    yield put(setNotificationIsVisible(true))

    yield finishAndClearState()

    return
  }

  const page = response.data.page
  const lastPage = response.data.lastPage
  const petitions = response.data.results

  if (page < lastPage) {
    yield put(setNextPage(page + 1))
  } else {
    yield put(setNextPage(null))
  }

  if (page === 1) {
    yield put(setPetitions(petitions))
  } else {
    yield put(addPetitions(petitions))
  }

  yield put(finishProgress())
  yield put(setSendingRequest(false))
  yield put(setLoadingPetitions(false))
}

function* editPetitionFlow(params) {
  yield put(startProgress())
  yield put(setSendingRequest(true))

  try {
    yield call(editPetitionEndpoint, params.data)
  } catch (error) {
    yield put(setNotificationType('error'))
    if (error.code === 'ECONNABORTED') {
      yield put(setNotificationMessage('timeoutError'))
    } else if (error.response.data.general === 'Petition not found') {
      yield put(setNotificationMessage('notFoundError'))
      yield put(removePetition(params.data.id))
    } else if (error.response.data.general === 'Is already accepted') {
      yield put(setNotificationMessage('alreadyAcceptedError'))
      yield put(changePetitionState(params.data.id, params.data.state))
    } else if (error.response.data.general === 'Is already canceled') {
      yield put(setNotificationMessage('alreadyCanceledError'))
      yield put(changePetitionState(params.data.id, params.data.state))
    } else if (error.response.data.general === 'Is already rejected') {
      yield put(setNotificationMessage('alreadyRejectedError'))
      yield put(changePetitionState(params.data.id, params.data.state))
    } else if (error.response.data.general === 'Should only be canceled') {
      yield put(setNotificationMessage('shouldOnlyBeCanceledError'))
    } else if (
      error.response.data.general ===
      'Event is already removed. Petition was removed'
    ) {
      yield put(setNotificationMessage('eventAlreadyRemovedError'))
      yield put(removePetition(params.data.id))
    } else if (
      error.response.data.general ===
      'User is already a participant of event. Petition was removed'
    ) {
      yield put(setNotificationMessage('userAlreadyParticipantError'))
      yield put(removePetition(params.data.id))
    } else if (error.response.data.general === 'Forbidden action') {
      yield put(setNotificationMessage('forbiddenActionError'))
      yield put(removePetition(params.data.id))
    } else if (
      error.response.data.general ===
      'User is already removed. Petition was removed'
    ) {
      yield put(setNotificationMessage('userAlreadyRemovedError'))
      yield put(removePetition(params.data.id))
    } else if (
      error.response.data.general ===
      'Team is already removed. Petition was removed'
    ) {
      yield put(setNotificationMessage('teamAlreadyRemovedError'))
      yield put(removePetition(params.data.id))
    } else if (
      error.response.data.general ===
      'User is already a member of team. Petition was removed'
    ) {
      yield put(setNotificationMessage('userAlreadyMemberError'))
      yield put(removePetition(params.data.id))
    } else {
      yield put(setNotificationMessage('serverError'))
    }
    yield put(setNotificationIsVisible(true))

    yield put(setSendingRequest(false))
    yield put(finishProgress())

    return
  }

  yield put(changePetitionState(params.data.id, params.data.state))
  yield put(setSendingRequest(false))
  yield put(finishProgress())
}

export default function* userSaga() {
  yield takeLatest(GET_USER, getUserFlow)
  yield takeLatest(LEAVE_TEAM, leaveTeamFlow)
  yield takeLatest(LEAVE_MAPATHON, leaveMapathonFlow)
  yield takeLatest(EDIT_USER, editUserFlow)
  yield takeLatest(SIGN_OUT, signOutFlow)
  yield takeLatest(GET_PETITIONS, getPetitionsFlow)
  yield takeLatest(EDIT_PETITION, editPetitionFlow)
}