import { describe, expect, it } from 'vitest'
import { parseXsuaaPolicies } from '../src/auth'

describe('authentication Logic', () => {
  it('correctly parses and groups XSUAA company assignments', () => {
    const mockPayload = {
      userId: 'TEST_USER_123',
      userCompanies: [
        { company: '1000', source: 'ERP' },
        { company: '2000', source: 'ERP' },
        { company: 'DE01', source: 'CRM' },
      ],
    }

    const context = parseXsuaaPolicies(mockPayload)

    expect(context.userId).toBe('TEST_USER_123')
    expect(context.policies).toHaveLength(2)

    const erpPolicy = context.policies.find(p => p.action === 'ERP')
    expect(erpPolicy).toBeDefined()
    expect(erpPolicy?.conditions.companyCode).toEqual(['1000', '2000'])

    const crmPolicy = context.policies.find(p => p.action === 'CRM')
    expect(crmPolicy).toBeDefined()
    expect(crmPolicy?.conditions.companyCode).toEqual(['DE01'])
  })

  it('handles empty company lists', () => {
    const context = parseXsuaaPolicies({ userId: 'ALONE', userCompanies: [] })
    expect(context.userId).toBe('ALONE')
    expect(context.policies).toHaveLength(0)
  })
})
