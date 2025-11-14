import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RubroFormModal from '../RubroFormModal.vue'
import { nextTick } from 'vue'

// Mock the dependencies
vi.mock('@/stores/rubros', () => ({
  useRubrosStore: vi.fn(() => ({
    createSubrubro: vi.fn(),
    updateRubro: vi.fn(),
    fetchChildren: vi.fn(),
    fetchTree: vi.fn()
  }))
}))

vi.mock('@/services/rubros', () => ({
  listRubros: vi.fn(() => Promise.resolve({
    items: [
      { id: 'parent1', name: 'Parent 1', level: 0 },
      { id: 'parent2', name: 'Parent 2', level: 1, parentId: 'parent1' }
    ]
  }))
}))

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn()
  }))
}))

describe('RubroFormModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const createWrapper = (props = {}) => {
    return mount(RubroFormModal, {
      props: {
        modelValue: true,
        mode: 'create',
        ...props
      }
    })
  }

  describe('Create Mode', () => {
    it('renders create modal correctly', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.text()).toContain('Crear Rubro')
      expect(wrapper.find('input[placeholder="Ingrese el nombre del rubro"]').exists()).toBe(true)
      expect(wrapper.find('button').text()).toContain('Crear')
    })

    it('validates name field', async () => {
      const wrapper = createWrapper()
      const input = wrapper.find('input[placeholder="Ingrese el nombre del rubro"]')
      
      // Test empty name
      await input.setValue('')
      await input.trigger('blur')
      await nextTick()
      
      expect(wrapper.text()).toContain('El nombre es requerido')
      
      // Test short name
      await input.setValue('a')
      await input.trigger('blur')
      await nextTick()
      
      expect(wrapper.text()).toContain('El nombre debe tener al menos 2 caracteres')
      
      // Test valid name
      await input.setValue('Valid Name')
      await input.trigger('blur')
      await nextTick()
      
      expect(wrapper.text()).not.toContain('El nombre es requerido')
      expect(wrapper.text()).not.toContain('El nombre debe tener al menos 2 caracteres')
    })

    it('loads parent options on mount', async () => {
      const wrapper = createWrapper()
      await nextTick()
      
      // Should load parent options
      expect(listRubros).toHaveBeenCalledWith({
        page: 1,
        size: 50,
        status: 'active'
      })
    })

    it('submits form with valid data', async () => {
      const wrapper = createWrapper()
      const store = wrapper.vm.store
      
      // Fill form
      await wrapper.find('input[placeholder="Ingrese el nombre del rubro"]').setValue('New Rubro')
      
      // Submit form
      await wrapper.find('button').trigger('click')
      await nextTick()
      
      // Should call createSubrubro
      expect(store.createSubrubro).toHaveBeenCalledWith(null, {
        name: 'New Rubro',
        parentId: null
      })
    })

    it('handles submission errors', async () => {
      const wrapper = createWrapper()
      const store = wrapper.vm.store
      
      // Mock error
      store.createSubrubro = vi.fn().mockRejectedValue({
        response: {
          status: 409,
          data: {
            code: 'CONFLICT',
            field: 'name',
            error: 'Ya existe un rubro con ese nombre'
          }
        }
      })
      
      // Fill form
      await wrapper.find('input[placeholder="Ingrese el nombre del rubro"]').setValue('Existing Rubro')
      
      // Submit form
      await wrapper.find('button').trigger('click')
      await nextTick()
      
      // Should show error
      expect(wrapper.text()).toContain('Ya existe un rubro con ese nombre')
    })
  })

  describe('Edit Mode', () => {
    it('renders edit modal correctly', () => {
      const existingRubro = {
        id: 'rubro1',
        name: 'Existing Rubro',
        parentId: null,
        level: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const wrapper = createWrapper({
        mode: 'edit',
        rubro: existingRubro
      })
      
      expect(wrapper.text()).toContain('Editar Rubro')
      expect(wrapper.find('input[placeholder="Ingrese el nombre del rubro"]').element.value).toBe('Existing Rubro')
      expect(wrapper.find('button').text()).toContain('Actualizar')
    })

    it('prevents self-reference in edit mode', async () => {
      const existingRubro = {
        id: 'rubro1',
        name: 'Existing Rubro',
        parentId: null,
        level: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const wrapper = createWrapper({
        mode: 'edit',
        rubro: existingRubro
      })
      
      // Try to set parent to self
      wrapper.vm.form.parent_id = 'rubro1'
      await nextTick()
      
      // Should show validation error
      expect(wrapper.vm.errors.parent_id).toBe('Un rubro no puede ser padre de sí mismo')
    })

    it('submits updated data', async () => {
      const existingRubro = {
        id: 'rubro1',
        name: 'Existing Rubro',
        parentId: null,
        level: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const wrapper = createWrapper({
        mode: 'edit',
        rubro: existingRubro
      })
      
      const store = wrapper.vm.store
      
      // Update form
      await wrapper.find('input[placeholder="Ingrese el nombre del rubro"]').setValue('Updated Rubro')
      
      // Submit form
      await wrapper.find('button').trigger('click')
      await nextTick()
      
      // Should call updateRubro
      expect(store.updateRubro).toHaveBeenCalledWith('rubro1', {
        name: 'Updated Rubro',
        parentId: null
      })
    })
  })

  describe('Modal Behavior', () => {
    it('closes modal on cancel', async () => {
      const wrapper = createWrapper()
      
      // Click cancel button
      const cancelButton = wrapper.findAll('button').find(button => button.text().includes('Cancelar'))
      await cancelButton?.trigger('click')
      
      // Should emit update:modelValue with false
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('resets form on close', async () => {
      const wrapper = createWrapper()
      
      // Fill form
      await wrapper.find('input[placeholder="Ingrese el nombre del rubro"]').setValue('Test Rubro')
      
      // Close modal
      wrapper.vm.handleClose()
      await nextTick()
      
      // Form should be reset
      expect(wrapper.vm.form.name).toBe('')
      expect(wrapper.vm.form.parent_id).toBe(null)
      expect(wrapper.vm.errors.name).toBe('')
      expect(wrapper.vm.errors.parent_id).toBe('')
    })

    it('clears cache on close', async () => {
      const wrapper = createWrapper()
      
      // Add some cache
      wrapper.vm.parentCache.set('test', [])
      
      // Close modal
      wrapper.vm.handleClose()
      
      // Cache should be cleared
      expect(wrapper.vm.parentCache.size).toBe(0)
    })
  })

  describe('Parent Selection', () => {
    it('searches for parents', async () => {
      const wrapper = createWrapper()
      await nextTick()
      
      // Trigger search
      wrapper.vm.handleParentSearch('search term')
      
      expect(listRubros).toHaveBeenCalledWith({
        page: 1,
        size: 50,
        status: 'active',
        q: 'search term'
      })
    })

    it('caches parent options', async () => {
      const wrapper = createWrapper()
      await nextTick()
      
      // First call should hit API
      expect(listRubros).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      wrapper.vm.loadParentOptions()
      await nextTick()
      
      expect(listRubros).toHaveBeenCalledTimes(1) // Still 1, used cache
    })

    it('filters out self-reference in edit mode', async () => {
      const existingRubro = {
        id: 'parent1',
        name: 'Parent 1',
        parentId: null,
        level: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const wrapper = createWrapper({
        mode: 'edit',
        rubro: existingRubro
      })
      await nextTick()
      
      // Should filter out the current rubro from options
      const options = wrapper.vm.parentOptions
      expect(options.find(opt => opt.value === 'parent1')).toBeUndefined()
    })
  })
})