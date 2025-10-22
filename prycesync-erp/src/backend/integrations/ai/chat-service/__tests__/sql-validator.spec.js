import { describe, it, expect } from 'vitest'
import { validateSql } from '../sql-validator.js'

describe('sql-validator', () => {
  it('rejects non-string input', () => {
    const res = validateSql(null)
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/no es string/i)
  })

  it('rejects non-SELECT statements', () => {
    const res = validateSql('UPDATE products SET name = "X" WHERE id=1')
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/solo se permiten select/i)
  })

  it('rejects dangerous operations', () => {
    // While unusual, the validator flags dangerous keywords even within literals
    const res = validateSql("SELECT 'drop' as x FROM products")
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/operación no permitida/i)
  })

  it('rejects multiple statements', () => {
    const res = validateSql('SELECT * FROM products; SELECT * FROM categories')
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/múltiples sentencias/i)
  })

  it('rejects disallowed tables', () => {
    const res = validateSql('SELECT * FROM users', ['products','inventory','categories'])
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/no permitidas/i)
  })

  it('accepts SELECT from allowed table and normalizes spaces', () => {
    const res = validateSql('  select   *  from   products   where   id = 1  ')
    expect(res.valid).toBe(true)
    expect(res.sql).toBe('select * from products where id = 1')
    expect(res.tables).toEqual(['products'])
  })

  it('accepts JOIN on allowed tables', () => {
    const res = validateSql('SELECT p.name, c.name FROM products p JOIN categories c ON c.id = p.category_id')
    expect(res.valid).toBe(true)
    expect(res.tables.sort()).toEqual(['products','categories'].sort())
  })

  it('supports schema-qualified names by taking last segment', () => {
    const res = validateSql('SELECT * FROM public.products JOIN public.inventory ON true')
    expect(res.valid).toBe(true)
    expect(res.tables.sort()).toEqual(['products','inventory'].sort())
  })
})