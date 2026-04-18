'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Phone, Mail, Trash2 } from 'lucide-react'
import { useEmployees } from '@/lib/hooks/useEmployees'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import PageHelp from '@/components/ui/PageHelp'
import type { Employee, EmployeeRole, PayType } from '@/lib/types'

const ROLES: { value: EmployeeRole; label: string; color: string }[] = [
  { value: 'owner',         label: 'Owner',         color: 'bg-purple-100 text-purple-800' },
  { value: 'manager',       label: 'Manager',        color: 'bg-blue-100 text-blue-800' },
  { value: 'estimator',     label: 'Estimator',      color: 'bg-indigo-100 text-indigo-800' },
  { value: 'crew_lead',     label: 'Crew Lead',      color: 'bg-green-100 text-green-800' },
  { value: 'crew_member',   label: 'Crew Member',    color: 'bg-gray-100 text-gray-700' },
  { value: 'office',        label: 'Office',         color: 'bg-pink-100 text-pink-800' },
  { value: 'subcontractor', label: 'Subcontractor',  color: 'bg-orange-100 text-orange-800' },
]

function roleCfg(r: EmployeeRole) {
  return ROLES.find(x => x.value === r) ?? ROLES[4]
}

type EmployeeWithChildren = Employee & { children: Employee[] }

function EmployeeNode({ emp, depth = 0, onDelete }: {
  emp: EmployeeWithChildren
  depth?: number
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(depth < 2)
  const cfg = roleCfg(emp.role)
  const hasChildren = emp.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-3 mb-1.5"
        style={{ marginLeft: depth * 20 }}
      >
        {hasChildren ? (
          <button onClick={() => setOpen(v => !v)} className="flex-shrink-0 text-gray-400">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {emp.first_name[0]}{emp.last_name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">
            {emp.first_name} {emp.last_name}
          </p>
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
            {emp.pay_rate && (
              <span className="text-xs text-gray-400">
                ${emp.pay_rate}/{emp.pay_type === 'hourly' ? 'hr' : 'yr'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {emp.phone && (
            <a href={`tel:${emp.phone}`} className="p-1.5 text-blue-400 active:text-blue-600">
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {emp.email && (
            <a href={`mailto:${emp.email}`} className="p-1.5 text-blue-400 active:text-blue-600">
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={() => onDelete(emp.id)} className="p-1.5 text-gray-300 active:text-red-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {open && hasChildren && (
        <div>
          {(emp.children as EmployeeWithChildren[]).map(child => (
            <EmployeeNode key={child.id} emp={child} depth={depth + 1} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EmployeesPage() {
  const { employees, loading, addEmployee, deactivateEmployee, buildTree } = useEmployees()
  const [showAdd, setShowAdd] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<EmployeeRole>('crew_member')
  const [managerId, setManagerId] = useState<string>('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [payRate, setPayRate] = useState('')
  const [payType, setPayType] = useState<PayType>('hourly')
  const [hireDate, setHireDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    setSaving(true)
    await addEmployee({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
      manager_id: managerId || null,
      phone: phone || null,
      email: email || null,
      pay_rate: payRate ? parseFloat(payRate) : null,
      pay_type: payType,
      hire_date: hireDate || null,
      profile_id: null,
      is_active: true,
      notes: null,
    })
    setSaving(false)
    setFirstName(''); setLastName(''); setPhone(''); setEmail(''); setPayRate(''); setHireDate(''); setManagerId('')
    setShowAdd(false)
  }

  const tree = buildTree() as EmployeeWithChildren[]

  if (loading) return <><TopBar title="Employees" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar
        title="Employees"
        backHref="/settings"
        right={
          <button onClick={() => setShowAdd(true)} className="p-1.5 rounded-lg text-blue-600 active:bg-blue-50">
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <div className="p-4 space-y-2 pb-28">

        {employees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-500 font-medium">No employees yet</p>
            <p className="text-gray-400 text-sm mt-1">Build your team org chart</p>
            <Button className="mt-4 mx-auto" onClick={() => setShowAdd(true)}>Add first employee</Button>
          </div>
        )}

        {/* Summary row */}
        {employees.length > 0 && (
          <div className="flex gap-2 mb-3">
            {ROLES.slice(0, 5).map(r => {
              const count = employees.filter(e => e.role === r.value).length
              if (!count) return null
              return (
                <span key={r.value} className={`px-2 py-1 rounded-lg text-xs font-semibold ${r.color}`}>
                  {count} {r.label}
                </span>
              )
            })}
          </div>
        )}

        {/* Org tree */}
        {tree.map(emp => (
          <EmployeeNode key={emp.id} emp={emp} onDelete={id => deactivateEmployee(id)} />
        ))}
      </div>

      <div>
        <PageHelp
          title="Employees"
          intro="The org tree shows everyone on your team with their role, pay rate, and contact info. Set a manager on each employee to build the hierarchy."
          steps={[
            'Tap + to add an employee — first name, last name, and role are required.',
            'Set "Reports to" to build the org tree. Employees with no manager appear at the top.',
            'Tap the phone or email icon on any row to call or email that employee directly.',
            'Tap the expand/collapse arrow to show or hide a manager\'s direct reports.',
            'Deactivate employees using the trash icon — they are marked inactive, not deleted.',
          ]}
          tips={[
            'Enter pay rates to use for job costing and payroll estimates.',
            'Use Crew Lead role for employees who manage a crew in the field.',
            'Add subcontractors here too so you have their contact info in one place.',
          ]}
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Employee">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name *" autoFocus
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name *"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    role === r.value ? 'bg-blue-600 text-white border-blue-600' : `${r.color} border-transparent`
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {employees.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Reports to</label>
              <select value={managerId} onChange={e => setManagerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">No manager (top level)</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {roleCfg(e.role).label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={payRate} onChange={e => setPayRate(e.target.value)} type="number" placeholder="Pay rate"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={payType} onChange={e => setPayType(e.target.value as PayType)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
            </select>
          </div>

          <input value={hireDate} onChange={e => setHireDate(e.target.value)} type="date" placeholder="Hire date"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />

          <Button type="submit" loading={saving} className="w-full" disabled={!firstName.trim() || !lastName.trim()}>
            Add employee
          </Button>
        </form>
      </Modal>
    </>
  )
}
