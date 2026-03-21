import client from './client'

export const getReviews = ({ type, jobCategory, careerLevel, keyword, page } = {}) =>
  client.get('/reviews', {
    params: {
      type: type || undefined,
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

export const deleteReview = (id) =>
  client.delete(`/reviews/${id}`)
