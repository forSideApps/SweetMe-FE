import client from './client'

export const getReviews = ({ type, status, jobCategory, careerLevel, keyword, page } = {}) =>
  client.get('/reviews', {
    params: {
      type: type || undefined,
      status: status || undefined,
      jobCategory: jobCategory || undefined,
      careerLevel: careerLevel || undefined,
      keyword: keyword || undefined,
      page: page ?? 0,
    }
  }).then(r => r.data)

export const getReview = (id) =>
  client.get(`/reviews/${id}`).then(r => r.data)

export const createReview = (data) =>
  client.post('/reviews', data).then(r => r.data)

export const incrementReviewView = (id) =>
  client.post(`/reviews/${id}/view`)

export const verifyReviewPassword = (id, password) =>
  client.post(`/reviews/${id}/verify`, { password })

export const updateReview = (id, data) =>
  client.put(`/reviews/${id}`, data).then(r => r.data)

export const markReviewDone = (id) =>
  client.post(`/reviews/${id}/done`)

export const markReviewPending = (id) =>
  client.post(`/reviews/${id}/pending`)

export const addReviewComment = (id, data) =>
  client.post(`/reviews/${id}/comments`, data)

export const updateReviewComment = (reviewId, commentId, data) =>
  client.put(`/reviews/${reviewId}/comments/${commentId}`, data)

export const deleteReviewComment = (reviewId, commentId, password) =>
  client.delete(`/reviews/${reviewId}/comments/${commentId}`, {
    data: { password },
  })

export const deleteReview = (id) =>
  client.delete(`/reviews/${id}`)

export const getReviewLink = (id, password) =>
  client.post(`/reviews/${id}/link`, { password }).then(r => r.data)

export const createExchange = (targetId, myReviewId) =>
  client.post(`/reviews/${targetId}/exchange`, { myReviewId }).then(r => r.data)

export const acceptExchange = (exchangeId) =>
  client.post(`/reviews/exchanges/${exchangeId}/accept`).then(r => r.data)

export const rejectExchange = (exchangeId) =>
  client.post(`/reviews/exchanges/${exchangeId}/reject`).then(r => r.data)

export const cancelExchange = (exchangeId) =>
  client.delete(`/reviews/exchanges/${exchangeId}`).then(r => r.data)
