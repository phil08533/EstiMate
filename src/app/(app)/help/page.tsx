'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'

interface HelpItem {
  id: string
  title: string
  keywords: string[]
  content: string
}

interface HelpSection {
  section: string
  icon: string
  items: HelpItem[]
}

const HELP_DATA: HelpSection[] = [
  {
    section: 'Getting Started',
    icon: '🚀',
    items: [
      {
        id: 'gs-login',
        title: 'How to sign in',
        keywords: ['login', 'sign in', 'google', 'magic link', 'email', 'auth'],
        content: 'Open EstiMate and tap "Continue with Google" for the fastest login, or enter your email to receive a magic link. No password needed. You\'ll be taken directly to your estimates list after signing in.',
      },
      {
        id: 'gs-install',
        title: 'Install as an app (PWA)',
        keywords: ['install', 'pwa', 'app', 'home screen', 'offline', 'download'],
        content: 'On iPhone/iPad: open in Safari, tap the Share button, then "Add to Home Screen." On Android: tap the browser menu (⋮), then "Add to Home Screen" or "Install App." On desktop Chrome/Edge: look for the install icon in the address bar. Once installed, EstiMate opens full-screen with no browser UI.',
      },
      {
        id: 'gs-navigate',
        title: 'Navigating the app',
        keywords: ['navigation', 'bottom', 'tabs', 'menu', 'bar'],
        content: 'Use the bottom navigation bar to switch between: Estimates (your main job list), Finances (expenses & P&L), Notes (daily notes), Resources (tax info & tips), and Settings (company, team, equipment).',
      },
    ],
  },
  {
    section: 'Estimates & Quotes',
    icon: '📋',
    items: [
      {
        id: 'est-create',
        title: 'Create a new estimate',
        keywords: ['new', 'create', 'add', 'estimate', 'quote', 'customer', 'capture', 'plus'],
        content: 'Tap the + button (top right on the Estimates screen). Enter the customer\'s name, phone, email, address, and any notes. Tap "Save" — you\'ll land on the estimate detail page ready to add line items.',
      },
      {
        id: 'est-status',
        title: 'Change estimate status',
        keywords: ['status', 'sent', 'sold', 'lost', 'need to estimate', 'won', 'follow up'],
        content: 'On the estimate detail page, tap the status badge at the top. Choose: Need to Estimate (amber), Sent (blue), Sold (green), or Lost (red). The status updates immediately and is visible on the estimates list.',
      },
      {
        id: 'est-followup',
        title: 'Set a follow-up date',
        keywords: ['follow up', 'reminder', 'date', 'overdue', 'callback'],
        content: 'On the estimate detail page, tap "Set follow-up date" in the customer info card. Pick a date — the estimate card will show an orange badge when overdue and a clock badge when due today. Great for following up on sent quotes.',
      },
      {
        id: 'est-assign',
        title: 'Assign an estimate to a team member',
        keywords: ['assign', 'team', 'member', 'crew', 'who'],
        content: 'On the estimate detail page, tap the "Unassigned" button next to the status badge. Select a team member from the list. The assignee\'s avatar and name appear on the estimate card in the list.',
      },
      {
        id: 'est-filter',
        title: 'Search and filter estimates',
        keywords: ['search', 'filter', 'sort', 'find', 'status', 'assignee'],
        content: 'On the Estimates list, tap the search bar to filter by customer name. Tap the filter chips below the search bar to filter by status (all, need to estimate, sent, sold, lost). Tap the sort icon to change sort order (date, name, area, status).',
      },
      {
        id: 'est-edit',
        title: 'Edit customer information',
        keywords: ['edit', 'customer', 'name', 'phone', 'address', 'update'],
        content: 'On the estimate detail page, tap the pencil icon (top right). Update the customer\'s name, phone, email, address, or notes. Tap "Save" to confirm changes.',
      },
      {
        id: 'est-delete',
        title: 'Delete an estimate',
        keywords: ['delete', 'remove', 'trash'],
        content: 'On the estimate edit page, scroll to the bottom and tap "Delete estimate." You\'ll be asked to confirm. Deleting an estimate also removes all associated media, measurements, line items, and payments.',
      },
    ],
  },
  {
    section: 'Line Items & Quoting',
    icon: '💰',
    items: [
      {
        id: 'li-add',
        title: 'Add a line item to a quote',
        keywords: ['line item', 'add', 'service', 'price', 'quote', 'item', 'cost'],
        content: 'On the estimate detail page, tap the "Quote" tab. Tap "+ Add item" at the bottom. Enter a description, quantity, price, and unit. Check "Tax exempt" if this item shouldn\'t be taxed. Tap "Add" — the subtotal and tax update automatically.',
      },
      {
        id: 'li-edit',
        title: 'Edit or delete a line item',
        keywords: ['edit', 'line item', 'update', 'delete', 'remove', 'price'],
        content: 'In the Quote tab, tap any line item to expand the inline edit form. Update description, quantity, or price. Tap the trash icon to delete the line item.',
      },
      {
        id: 'li-catalog',
        title: 'Use the service catalog',
        keywords: ['catalog', 'service', 'saved', 'reuse', 'quick', 'template item'],
        content: 'In the Quote tab, tap "Service catalog" to expand your saved services. Tap any catalog item to add it instantly with its default price. You can adjust the price after adding. Add items to the catalog from the same panel by tapping "Add to catalog."',
      },
      {
        id: 'li-template',
        title: 'Save and use quote templates',
        keywords: ['template', 'save', 'apply', 'reuse', 'preset', 'bundle'],
        content: 'In the Quote tab, tap "Templates" to open the template panel. To save current line items as a template, tap "Save as template" and give it a name. To apply a template, tap any saved template — its line items are added to the current estimate. Great for standard job packages like "Basic Lawn Care" or "Full Landscape Install."',
      },
      {
        id: 'li-tax',
        title: 'Tax calculation',
        keywords: ['tax', 'tax rate', 'total', 'exempt', 'calculate'],
        content: 'Tax is calculated using the tax rate set in Settings → Company Settings. Only non-exempt items are taxed. The Quote tab shows: subtotal, tax amount, and grand total. To set your tax rate, go to Settings → Company Settings and enter your rate in the "Tax Rate (%)" field.',
      },
    ],
  },
  {
    section: 'Invoice & PDF',
    icon: '🧾',
    items: [
      {
        id: 'inv-open',
        title: 'View and print an invoice',
        keywords: ['invoice', 'pdf', 'print', 'share', 'send', 'save'],
        content: 'On the estimate detail page, tap the document icon (top right, next to the pencil). This opens the invoice view showing your company logo, company info, customer billing info, all line items, tax, and total. Tap "Save PDF" to print or save to files using your device\'s print dialog.',
      },
      {
        id: 'inv-logo',
        title: 'Add your company logo to invoices',
        keywords: ['logo', 'invoice', 'company', 'brand', 'image'],
        content: 'Go to Settings → Company Settings. Tap "Upload Logo" to choose an image from your device. Use the − and + buttons to scale the logo size (50%–200%). Your logo appears at the top of every invoice.',
      },
      {
        id: 'inv-company',
        title: 'Set up company info on invoices',
        keywords: ['company', 'info', 'details', 'license', 'invoice', 'footer'],
        content: 'Go to Settings → Company Settings. Fill in: Company Name, Phone, Email, Address, Website, and License Number. Set your default Payment Terms (e.g. "Net 30") and Footer Notes (e.g. "Thank you for your business!"). All these appear on every invoice automatically.',
      },
    ],
  },
  {
    section: 'Payments',
    icon: '💳',
    items: [
      {
        id: 'pay-record',
        title: 'Record a payment',
        keywords: ['payment', 'paid', 'record', 'cash', 'check', 'card', 'received'],
        content: 'On the estimate detail page, tap the "Payments" tab. Tap "Record payment." Enter the amount, select the payment method (cash, check, card, bank transfer, or other), choose the date, and optionally add a note. Tap "Record payment" to save.',
      },
      {
        id: 'pay-balance',
        title: 'Check the balance due',
        keywords: ['balance', 'due', 'paid', 'owed', 'total'],
        content: 'In the Payments tab, the summary card shows: Invoice total (from line items + tax), Total paid, and Balance due. When the balance is zero, it shows "Paid in full" in green.',
      },
      {
        id: 'pay-delete',
        title: 'Delete a payment',
        keywords: ['delete', 'remove', 'payment', 'undo'],
        content: 'In the Payments tab, each payment row has a trash icon on the right. Tap it to delete that payment. The balance due updates immediately.',
      },
    ],
  },
  {
    section: 'Photos & Media',
    icon: '📷',
    items: [
      {
        id: 'media-upload',
        title: 'Take or upload a photo',
        keywords: ['photo', 'camera', 'upload', 'picture', 'image', 'video'],
        content: 'On the estimate detail page, tap the "Media" tab. Tap the camera button to take a new photo directly with your phone camera. Tap the gallery button to choose from your photos. Videos are also supported. Photos are stored securely in the cloud.',
      },
      {
        id: 'media-annotate',
        title: 'Annotate a photo',
        keywords: ['annotate', 'draw', 'mark', 'arrow', 'label', 'pen', 'annotation'],
        content: 'In the Media tab, tap a photo to view it fullscreen. Tap the pencil icon to open the annotation editor. Use the toolbar to switch between: freehand pen, arrow, rectangle, and text tools. Choose colors and line thickness. Tap undo to step back. Tap "Save" to store your annotations with the photo.',
      },
      {
        id: 'media-delete',
        title: 'Delete a photo or video',
        keywords: ['delete', 'remove', 'photo', 'media'],
        content: 'In the Media tab, press and hold (or look for the trash icon on) any media thumbnail to delete it. You\'ll be asked to confirm.',
      },
    ],
  },
  {
    section: 'Measurements',
    icon: '📐',
    items: [
      {
        id: 'meas-add',
        title: 'Add a measurement',
        keywords: ['measurement', 'area', 'length', 'width', 'sq ft', 'square feet'],
        content: 'On the estimate detail page, tap the "Measure" tab. Tap "+ Add measurement." Enter a label (e.g. "Backyard"), length, and width. The area is calculated automatically. Tap "Add" to save. The total area shown on the estimate card sums all measurements.',
      },
      {
        id: 'meas-groups',
        title: 'Organize measurements into groups',
        keywords: ['group', 'organize', 'measurement', 'zone', 'area', 'section'],
        content: 'In the Measure tab, tap "+ Add group" to create a named group (e.g. "Front Yard", "Back Patio"). Add measurements directly inside each group. Each group shows its subtotal area. Move existing measurements to a group by tapping the chevron icon on the measurement row.',
      },
      {
        id: 'meas-total',
        title: 'View the total measured area',
        keywords: ['total', 'area', 'all', 'sum', 'square feet', 'display'],
        content: 'The total area is displayed on the estimate card in the list view. In the Measure tab, each group shows its subtotal and ungrouped measurements are summed separately. The total is maintained automatically by the database — no manual calculation needed.',
      },
    ],
  },
  {
    section: 'Finances',
    icon: '📊',
    items: [
      {
        id: 'fin-overview',
        title: 'View P&L summary',
        keywords: ['profit', 'loss', 'revenue', 'income', 'expenses', 'overview', 'pl'],
        content: 'Tap "Finances" in the bottom nav. The top card shows: Total Revenue (all payments received), Total Expenses, and Net Profit/Loss for all time. Switch to the "Revenue" tab to see payments month-by-month. Switch to "Expenses" to see your cost breakdown.',
      },
      {
        id: 'fin-expense',
        title: 'Log a business expense',
        keywords: ['expense', 'cost', 'add', 'log', 'track', 'fuel', 'materials'],
        content: 'In the Finances screen, tap "+ Add expense." Enter a description, amount, date, and optionally a vendor name. Select a category: Materials, Labor, Equipment, Fuel, Insurance, Marketing, Office, Utilities, Subcontractor, or Other. The expense appears in the monthly breakdown below.',
      },
      {
        id: 'fin-categories',
        title: 'Expense categories',
        keywords: ['category', 'expense', 'type', 'materials', 'labor', 'fuel'],
        content: 'Expenses are organized into 10 categories: Materials (supplies, plants), Labor (crew wages), Equipment (machinery costs), Fuel (gas for vehicles/equipment), Insurance (business insurance), Marketing (ads, flyers), Office (software, supplies), Utilities (shop bills), Subcontractor (hired subs), and Other.',
      },
    ],
  },
  {
    section: 'Equipment',
    icon: '🔧',
    items: [
      {
        id: 'eq-add',
        title: 'Add equipment to your fleet',
        keywords: ['equipment', 'add', 'mower', 'truck', 'trailer', 'tools'],
        content: 'Go to Settings → Equipment. Tap the + button. Enter the equipment name, make, model, year, serial number, purchase date, and price. Set the initial status (Active, Maintenance, or Retired). Tap "Add equipment" to save.',
      },
      {
        id: 'eq-log',
        title: 'Log maintenance or repairs',
        keywords: ['maintenance', 'repair', 'log', 'service', 'cost', 'equipment'],
        content: 'Open any equipment item. Tap "+ Add entry" in the Activity Log section. Choose the type: Maintenance, Repair, Fuel, or Note. Enter a description and optionally a cost. The total logged cost is shown on the equipment detail card.',
      },
      {
        id: 'eq-status',
        title: 'Change equipment status',
        keywords: ['status', 'active', 'maintenance', 'retired', 'equipment'],
        content: 'Open any equipment item. In the Status section, tap "Active," "In Maintenance," or "Retired" to update. Equipment is grouped by status on the Equipment list page.',
      },
    ],
  },
  {
    section: 'Notes',
    icon: '📝',
    items: [
      {
        id: 'notes-today',
        title: 'Write today\'s note',
        keywords: ['notes', 'today', 'daily', 'write', 'text'],
        content: 'Tap "Notes" in the bottom nav. Today\'s note appears at the top automatically — just start typing. It saves automatically as you type (no save button needed). The title defaults to today\'s date.',
      },
      {
        id: 'notes-past',
        title: 'View past notes',
        keywords: ['past', 'previous', 'history', 'notes', 'old'],
        content: 'In the Notes screen, scroll down below today\'s note to see past notes grouped by date. Tap any note to open and edit it. Use the search bar to find notes by title or content.',
      },
      {
        id: 'notes-share',
        title: 'Share a note',
        keywords: ['share', 'link', 'note', 'send', 'public'],
        content: 'Open any note and tap the share icon. You can share just that note or all team notes. A shareable link is generated — anyone with the link can view the note(s) in read-only mode without needing to log in.',
      },
    ],
  },
  {
    section: 'Team & Sharing',
    icon: '👥',
    items: [
      {
        id: 'team-invite',
        title: 'Invite a team member',
        keywords: ['invite', 'team', 'member', 'add', 'email', 'share'],
        content: 'Go to Settings → Team & Members. Tap "Invite member." Enter their email address and choose a role: Member (can view and edit) or Viewer (can only view). Tap "Send invite" — they\'ll receive an email link to join your team.',
      },
      {
        id: 'team-roles',
        title: 'Team roles: Member vs Viewer',
        keywords: ['role', 'member', 'viewer', 'permission', 'access', 'edit'],
        content: 'Owner: full control including team management. Member: can create, edit, and delete estimates, notes, expenses, etc. Viewer: read-only access — they can see everything but cannot make changes. To change a member\'s role, tap their name in the Team & Members list.',
      },
      {
        id: 'team-share',
        title: 'Share estimates with a client (public link)',
        keywords: ['share', 'client', 'link', 'public', 'estimate', 'read only'],
        content: 'Go to Settings → Team & Members. Scroll to "Share Links." Tap "New share link" — this creates a read-only link to all your team\'s estimates. Share it with clients so they can view estimates without needing an account. Links can be deleted to revoke access.',
      },
    ],
  },
  {
    section: 'Resources',
    icon: '📚',
    items: [
      {
        id: 'res-tax',
        title: 'Look up state tax rates',
        keywords: ['tax', 'state', 'sales tax', 'income tax', 'sui', 'payroll', 'federal'],
        content: 'In Resources, tap the "Tax Reference" tab. The top section shows federal payroll tax rates (Social Security, Medicare, FUTA). Below that, search for any state to see its sales tax rate, income tax, state unemployment insurance (SUI) rate, and key notes. Always verify with a CPA before filing.',
      },
      {
        id: 'res-tips',
        title: 'Business tips for contractors',
        keywords: ['tips', 'advice', 'pricing', 'sales', 'cash flow', 'grow', 'business'],
        content: 'In Resources, tap the "Business Tips" tab. Browse 30+ tips organized in 6 categories: Pricing & Profitability, Sales & Closing Deals, Managing Cash Flow, Running Your Crew, Growing the Business, and Legal & Protection. Tap any category to expand and read the tips.',
      },
      {
        id: 'res-calculator',
        title: 'Material calculator',
        keywords: ['calculator', 'material', 'mulch', 'topsoil', 'gravel', 'concrete', 'sod', 'cubic yards', 'bags'],
        content: 'In Resources, tap the "Calculator" tab. Enter the area (sq ft) and select a material type. For bulk materials (mulch, topsoil, gravel), enter the desired depth in inches — the calculator shows cubic yards needed and estimated bags. For sod and seed, it shows pallets/lbs needed. Enter a price per unit to see the total material cost.',
      },
    ],
  },
  {
    section: 'Company Settings',
    icon: '🏢',
    items: [
      {
        id: 'cs-setup',
        title: 'Set up your company profile',
        keywords: ['company', 'settings', 'name', 'phone', 'email', 'address', 'license'],
        content: 'Go to Settings → Company Settings. Fill in your company name, phone, email, physical address, website, and contractor license number. These appear on all invoices and shared links.',
      },
      {
        id: 'cs-tax',
        title: 'Set your default tax rate',
        keywords: ['tax rate', 'tax', 'percent', 'default', 'settings'],
        content: 'Go to Settings → Company Settings. Enter your local sales tax rate in the "Tax Rate (%)" field (e.g. 8.5). This rate is used automatically for all taxable line items across all estimates.',
      },
      {
        id: 'cs-terms',
        title: 'Set default payment terms',
        keywords: ['payment terms', 'net 30', 'due on receipt', 'invoice', 'terms'],
        content: 'Go to Settings → Company Settings. Enter payment terms in the "Payment Terms" field (e.g. "Net 30", "Due on receipt", "50% deposit required"). These appear on every invoice.',
      },
    ],
  },
]

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      : part
  )
}

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return HELP_DATA
    return HELP_DATA.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q)) ||
        item.content.toLowerCase().includes(q)
      ),
    })).filter(section => section.items.length > 0)
  }, [query])

  function toggle(id: string) {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function expandAll() {
    const ids = new Set(filtered.flatMap(s => s.items.map(i => i.id)))
    setOpenItems(ids)
  }

  return (
    <>
      <TopBar title="How to Use" backHref="/settings" />
      <div className="pb-28">
        {/* Sticky search */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); expandAll() }}
              placeholder="Search help topics…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {filtered.map(section => (
            <div key={section.section}>
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-lg">{section.icon}</span>
                <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{section.section}</h2>
              </div>
              <div className="space-y-1.5">
                {section.items.map(item => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle(item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900 text-sm pr-4">
                        {query ? highlight(item.title, query) : item.title}
                      </span>
                      {openItems.has(item.id)
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      }
                    </button>
                    {openItems.has(item.id) && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {query ? highlight(item.content, query) : item.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-gray-400 text-center pt-4">
            EstiMate v2 · {filtered.reduce((n, s) => n + s.items.length, 0)} help topics
          </p>
        </div>
      </div>
    </>
  )
}
