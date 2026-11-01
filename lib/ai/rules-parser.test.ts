import { describe, expect, test } from 'vitest'
import { parseAdmissionQuery } from './rules-parser'

describe('rules parser', () => {
  test('percentile, branch, city', () => {
    const query = parseAdmissionQuery('85 percentile CS Mumbai')
    expect(query).toMatchObject({
      intent: 'predict',
      percentile: 85,
      branch: 'Computer Engineering',
      city: 'Mumbai',
    })
  })

  test('full MHT-CET sentence with category and budget', () => {
    const query = parseAdmissionQuery(
      'I got 92.5% in MHT-CET, OBC category, want IT in Pune under 1.5 lakh'
    )
    expect(query).toMatchObject({
      intent: 'predict',
      exam: 'MHT-CET',
      percentile: 92.5,
      category: 'OBC',
      branch: 'Information Technology',
      city: 'Pune',
      budget: 150000,
    })
  })

  test('JEE exam and EWS category', () => {
    const query = parseAdmissionQuery('JEE 99.2 percentile EWS CSE')
    expect(query.exam).toBe('JEE')
    expect(query.category).toBe('EWS')
    expect(query.branch).toBe('Computer Engineering')
  })

  test('general maps to OPEN', () => {
    expect(parseAdmissionQuery('90 percentile general category').category).toBe('OPEN')
  })

  test('other-than-home quota is explicit', () => {
    expect(parseAdmissionQuery('97 percentile other than home university').homeUniversity).toBe(false)
    expect(parseAdmissionQuery('97 percentile home university quota').homeUniversity).toBe(true)
  })

  test('deadline intent', () => {
    expect(parseAdmissionQuery('What is the last date for CAP round 3?').intent).toBe('deadline')
  })

  test('fees intent keeps the college name', () => {
    const query = parseAdmissionQuery('What are the fees for COEP?')
    expect(query.intent).toBe('fees')
    expect(query.colleges).toContain('COEP')
  })

  test('eligibility intent and TFWS category', () => {
    const query = parseAdmissionQuery('Am I eligible for TFWS?')
    expect(query.intent).toBe('eligibility')
    expect(query.category).toBe('TFWS')
    expect(query.percentile).toBeUndefined()
  })

  test('compare intent captures both acronyms', () => {
    const query = parseAdmissionQuery('Compare COEP vs VJTI for computer engineering')
    expect(query.intent).toBe('compare')
    expect(query.colleges).toEqual(expect.arrayContaining(['COEP', 'VJTI']))
    expect(query.branch).toBe('Computer Engineering')
  })

  test('unknown intent does not invent slots', () => {
    expect(parseAdmissionQuery('hello there')).toEqual({ intent: 'unknown' })
  })

  test('percentile before the word percentile', () => {
    expect(parseAdmissionQuery('percentile 88.25, SC, mechanical').percentile).toBe(88.25)
  })

  test('percentile out of range is ignored', () => {
    expect(parseAdmissionQuery('145 percentile').percentile).toBeUndefined()
  })

  test('AI branch is recognized', () => {
    expect(parseAdmissionQuery('80 percentile AI branch').branch).toBe(
      'Artificial Intelligence & Data Science'
    )
  })
})
