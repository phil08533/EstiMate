export interface TipCategory {
  category: string
  icon: string
  tips: { title: string; body: string }[]
}

export const CONTRACTOR_TIPS: TipCategory[] = [
  {
    category: 'Pricing & Profitability',
    icon: '💰',
    tips: [
      {
        title: 'Know your break-even cost per hour',
        body: 'Add up ALL your expenses for the year (labor, equipment, fuel, insurance, overhead) and divide by billable hours. If that number is $45/hr and you charge $45/hr, you make nothing. Aim for at least 30–40% margin on top.',
      },
      {
        title: 'Price the job, not the time',
        body: 'Customers don\'t care how long it takes — they care about the result. Price based on value, scope, and materials, not hours. Experienced crews who finish faster should earn more, not less.',
      },
      {
        title: 'Never estimate from photos or descriptions alone',
        body: 'Always do a site visit before quoting. Hidden obstacles (rocks, irrigation, slopes, access issues) can double your labor cost. Five minutes on-site saves hours of regret.',
      },
      {
        title: 'Build a material buffer into every quote',
        body: 'Add 10–15% to material quantities in your estimate. Prices change, waste happens, and you always need more than you planned. Better to have leftover material than a short job and an unhappy customer.',
      },
      {
        title: 'Charge for drive time and fuel',
        body: 'If a job is 45 minutes away, that\'s 1.5 hours of round-trip time you\'re paying your crew for. Build a travel surcharge for jobs over 20 minutes away — or factor it into the job price.',
      },
      {
        title: 'Raise your prices every year',
        body: 'Inflation is real. If your prices haven\'t changed in 2 years, you\'ve effectively taken a pay cut. Most customers expect small annual increases. Raise prices 5–8% each year rather than one big jump.',
      },
    ],
  },
  {
    category: 'Sales & Closing Deals',
    icon: '🤝',
    tips: [
      {
        title: 'Follow up within 24 hours',
        body: 'Studies show 80% of sales require 5+ follow-ups, but most contractors follow up once or never. A quick text 24 hours after sending an estimate dramatically increases close rates.',
      },
      {
        title: 'Present three options: good, better, best',
        body: 'Never give just one price. Offer a basic scope, a recommended scope, and a premium option. Most customers choose the middle. This also anchors the conversation around upgrading, not discounting.',
      },
      {
        title: 'Take photos before and after every job',
        body: 'Before/after photos are your best marketing. Post them on social media, use them in proposals, and send them to the customer when done. Visual proof builds trust and closes future sales.',
      },
      {
        title: 'Ask for referrals after every great job',
        body: '"Do you know anyone who could use our services?" — ask this on the day of completion when the customer is happiest. Referrals convert at 4× the rate of cold leads and cost you nothing.',
      },
      {
        title: 'Get it in writing — always',
        body: 'A signed estimate protects you and sets clear expectations. It prevents scope creep ("I thought that was included") and gives you something to reference when the customer changes their mind.',
      },
    ],
  },
  {
    category: 'Managing Cash Flow',
    icon: '📊',
    tips: [
      {
        title: 'Require a deposit for every job',
        body: 'Ask for 25–50% deposit before starting any job over $500. This covers your material costs and filters out non-serious customers. Most reputable contractors require this — customers expect it.',
      },
      {
        title: 'Invoice immediately after job completion',
        body: 'The longer you wait to invoice, the longer you wait to get paid. Invoice the same day the job is done — send it from the job site before you leave if possible.',
      },
      {
        title: 'Offer a small discount for fast payment',
        body: '"2/10 Net 30" means 2% discount if paid within 10 days, full amount due in 30. Many customers will pay fast for a small discount. This helps your cash flow significantly.',
      },
      {
        title: 'Keep 3 months of operating expenses in reserve',
        body: 'Landscaping is seasonal. Build a cash cushion during busy months to cover slow periods. Don\'t mistake a good summer for permanent income — equipment breaks, weather changes, and customers cancel.',
      },
      {
        title: 'Separate business and personal finances',
        body: 'Get a business checking account and business credit card. Pay yourself a salary. This makes taxes easier, makes you look more professional, and protects you legally.',
      },
    ],
  },
  {
    category: 'Running Your Crew',
    icon: '👷',
    tips: [
      {
        title: 'Document your processes before you hire',
        body: 'Write down how you do everything — how to edge a bed, how to load a trailer, how to interact with customers. This lets you train new people consistently and maintain your quality standard.',
      },
      {
        title: 'Pay good people well',
        body: 'The cost of turnover (recruiting, training, mistakes) is far higher than the cost of a raise. Top laborers who stick around are worth $2–4/hr more than what\'s "market rate." Pay for reliability.',
      },
      {
        title: 'Track labor hours per job',
        body: 'The only way to know if your pricing is right is to compare estimated hours to actual hours on every job. Even a simple spreadsheet will reveal which job types are profitable and which are not.',
      },
      {
        title: 'Create a pre-job checklist for your trailer',
        body: 'Nothing kills productivity like driving 30 minutes and realizing you forgot a tool. A laminated checklist on the trailer door — equipment, fuel, water, forms — pays for itself the first time it catches a mistake.',
      },
    ],
  },
  {
    category: 'Growing the Business',
    icon: '🌱',
    tips: [
      {
        title: 'Get online reviews — they\'re gold',
        body: 'A Google Business profile with 50+ reviews is worth $50,000 in advertising. Ask every happy customer to leave a review. Send them a direct link. One review a week compounding over 2 years changes your business.',
      },
      {
        title: 'Start with recurring maintenance contracts',
        body: 'One-time jobs are unpredictable. Recurring lawn care or maintenance contracts give you predictable revenue and fill your calendar. Price them to be worth your while — don\'t compete on being cheapest.',
      },
      {
        title: 'Specialize to charge a premium',
        body: 'Generalists compete on price. Specialists compete on expertise. Becoming known as "the irrigation people" or "the high-end landscape design crew" in your area allows you to charge 20–40% more.',
      },
      {
        title: 'Use the slow season for marketing and planning',
        body: 'Winter is when you should be sending mailers, updating your website, reaching out to past customers, and preparing estimates for spring jobs. Companies that do this have a full schedule before the season starts.',
      },
      {
        title: 'Track where every lead comes from',
        body: 'Ask every new customer "How did you hear about us?" Write it down. After 6 months you\'ll know whether your Google ads, door hangers, or referrals are working — and where to invest more.',
      },
    ],
  },
  {
    category: 'Legal & Protection',
    icon: '🛡️',
    tips: [
      {
        title: 'Get liability insurance before you need it',
        body: 'One broken window, damaged irrigation line, or slip-and-fall claim can cost more than a year of revenue. General liability insurance ($1–2M) typically costs $1,200–$3,000/year. It\'s not optional.',
      },
      {
        title: 'Form an LLC',
        body: 'An LLC separates your personal assets from business liability. If someone sues your business, they can\'t come after your house or personal savings. Most states charge $50–$500 to form an LLC — worth every penny.',
      },
      {
        title: 'Use contracts with a clear change order clause',
        body: 'Scope creep is the silent killer of profit. Your contract should state clearly that any work not listed in the original estimate requires a written change order with a new price before work begins.',
      },
      {
        title: 'Verify worker classification carefully',
        body: 'Misclassifying employees as contractors is one of the most common (and costly) mistakes in the trades. The IRS has strict tests. If you control how, when, and where someone works — they may legally be an employee.',
      },
    ],
  },
]
