export interface StateTaxInfo {
  state: string
  abbr: string
  salesTax: number        // base state rate %
  incomeTax: string       // flat rate or range description
  suiRate: string         // state unemployment insurance rate range
  notes: string
}

export const STATE_TAX_DATA: StateTaxInfo[] = [
  { state: 'Alabama', abbr: 'AL', salesTax: 4.0, incomeTax: '2%–5%', suiRate: '0.65%–6.8%', notes: 'County/city taxes add up to ~5% more. LLC owners pay income tax on profits.' },
  { state: 'Alaska', abbr: 'AK', salesTax: 0, incomeTax: 'None', suiRate: '1%–5.4%', notes: 'No state income or sales tax. Some local boroughs levy sales tax.' },
  { state: 'Arizona', abbr: 'AZ', salesTax: 5.6, incomeTax: '2.5% flat', suiRate: '0.08%–20.93%', notes: 'Flat income tax enacted 2023. Transaction privilege tax applies to contractors.' },
  { state: 'Arkansas', abbr: 'AR', salesTax: 6.5, incomeTax: '2%–4.7%', suiRate: '0.3%–14.2%', notes: 'Graduated income tax. Materials generally taxable for contractors.' },
  { state: 'California', abbr: 'CA', salesTax: 7.25, incomeTax: '1%–13.3%', suiRate: '1.5%–6.2%', notes: 'Highest income tax in the US. SDI tax 0.9% on employee wages. Employment taxes complex.' },
  { state: 'Colorado', abbr: 'CO', salesTax: 2.9, incomeTax: '4.4% flat', suiRate: '0.75%–10.39%', notes: 'Flat income tax. Local taxes vary widely—Denver adds 4.75%. Materials often taxable.' },
  { state: 'Connecticut', abbr: 'CT', salesTax: 6.35, incomeTax: '3%–6.99%', suiRate: '1.9%–6.8%', notes: 'Landscaping services taxable. Business entity tax may apply.' },
  { state: 'Delaware', abbr: 'DE', salesTax: 0, incomeTax: '2.2%–6.6%', suiRate: '0.3%–8.2%', notes: 'No sales tax. Gross receipts tax applies instead. Favorable business environment.' },
  { state: 'Florida', abbr: 'FL', salesTax: 6.0, incomeTax: 'None (individual)', suiRate: '0.1%–5.4%', notes: 'No state income tax on individuals. Corporate income tax 5.5%. Landscaping materials taxable.' },
  { state: 'Georgia', abbr: 'GA', salesTax: 4.0, incomeTax: '5.49% flat', suiRate: '0.04%–8.1%', notes: 'Moving to flat income tax rate. Materials and some services taxable.' },
  { state: 'Hawaii', abbr: 'HI', salesTax: 4.0, incomeTax: '1.4%–11%', suiRate: '0%–5.6%', notes: 'General Excise Tax (GET) applies broadly—nearly all services taxable at 4%. High cost of living.' },
  { state: 'Idaho', abbr: 'ID', salesTax: 6.0, incomeTax: '5.8% flat', suiRate: '0.207%–5.4%', notes: 'Flat income tax. Labor for landscaping often exempt if separately stated.' },
  { state: 'Illinois', abbr: 'IL', salesTax: 6.25, incomeTax: '4.95% flat', suiRate: '0.725%–7.625%', notes: 'Flat income tax. Chicago adds significant local taxes. Landscaping services sometimes taxable.' },
  { state: 'Indiana', abbr: 'IN', salesTax: 7.0, incomeTax: '3.05% flat', suiRate: '0.5%–7.4%', notes: 'Flat income tax. Counties add up to 3.38%. Landscaping materials taxable.' },
  { state: 'Iowa', abbr: 'IA', salesTax: 6.0, incomeTax: '4.4% flat (2026)', suiRate: '0%–7%', notes: 'Transitioning to flat income tax. Commercial lawn care may be taxable.' },
  { state: 'Kansas', abbr: 'KS', salesTax: 6.5, incomeTax: '3.1%–5.7%', suiRate: '0.2%–7.6%', notes: 'High sales tax. Landscaping labor often exempt; materials taxable.' },
  { state: 'Kentucky', abbr: 'KY', salesTax: 6.0, incomeTax: '4.5% flat', suiRate: '1%–10%', notes: 'Flat income tax. Many services now taxable including landscaping.' },
  { state: 'Louisiana', abbr: 'LA', salesTax: 4.45, incomeTax: '1.85%–4.25%', suiRate: '0.09%–6.2%', notes: 'Parish sales taxes add 4–5%. Contractors pay sales tax on materials at purchase.' },
  { state: 'Maine', abbr: 'ME', salesTax: 5.5, incomeTax: '5.8%–7.15%', suiRate: '0.49%–5.4%', notes: 'Landscaping services taxable. High income tax on top earners.' },
  { state: 'Maryland', abbr: 'MD', salesTax: 6.0, incomeTax: '2%–5.75%', suiRate: '1%–10.5%', notes: 'County income taxes add 2.25–3.2%. Landscaping labor may be taxable.' },
  { state: 'Massachusetts', abbr: 'MA', salesTax: 6.25, incomeTax: '5% (9% over $1M)', suiRate: '0.94%–14.37%', notes: 'Millionaire surtax enacted. Landscape services generally not taxable.' },
  { state: 'Michigan', abbr: 'MI', salesTax: 6.0, incomeTax: '4.05% flat', suiRate: '0.06%–10.3%', notes: 'Flat income tax. Landscaping services generally not taxable; materials are.' },
  { state: 'Minnesota', abbr: 'MN', salesTax: 6.875, incomeTax: '5.35%–9.85%', suiRate: '0.1%–9%', notes: 'High income tax. Landscaping services taxable. Local taxes add up to 2%.' },
  { state: 'Mississippi', abbr: 'MS', salesTax: 7.0, incomeTax: '4.7% flat', suiRate: '0.2%–5.4%', notes: 'Moving to flat income tax. High sales tax rate.' },
  { state: 'Missouri', abbr: 'MO', salesTax: 4.225, incomeTax: '2%–4.8%', suiRate: '0%–6%', notes: 'Local taxes add significantly. Landscaping labor often exempt.' },
  { state: 'Montana', abbr: 'MT', salesTax: 0, incomeTax: '4.7% flat', suiRate: '0%–6.12%', notes: 'No sales tax. Flat income tax. Resort taxes apply in some areas.' },
  { state: 'Nebraska', abbr: 'NE', salesTax: 5.5, incomeTax: '2.46%–6.64%', suiRate: '0%–5.4%', notes: 'Landscaping services taxable. City sales taxes may apply.' },
  { state: 'Nevada', abbr: 'NV', salesTax: 6.85, incomeTax: 'None', suiRate: '0.25%–5.4%', notes: 'No income tax. Commerce tax applies to businesses grossing over $4M. Materials taxable.' },
  { state: 'New Hampshire', abbr: 'NH', salesTax: 0, incomeTax: 'None (2025+)', suiRate: '0.1%–8.5%', notes: 'No sales or income tax on wages. Business profits tax (7.5%) applies.' },
  { state: 'New Jersey', abbr: 'NJ', salesTax: 6.625, incomeTax: '1.4%–10.75%', suiRate: '0.4%–5.4%', notes: 'High property and income taxes. Landscaping services taxable.' },
  { state: 'New Mexico', abbr: 'NM', salesTax: 5.0, incomeTax: '1.7%–5.9%', suiRate: '0.33%–6.4%', notes: 'Gross receipts tax applies to services including landscaping.' },
  { state: 'New York', abbr: 'NY', salesTax: 4.0, incomeTax: '4%–10.9%', suiRate: '2.025%–9.825%', notes: 'NYC adds 4.5% income tax + 4.5% sales tax. MTA surcharge. Very high combined burden.' },
  { state: 'North Carolina', abbr: 'NC', salesTax: 4.75, incomeTax: '4.5% flat', suiRate: '0.06%–5.76%', notes: 'Moving to flat income tax. Landscaping services taxable since 2016.' },
  { state: 'North Dakota', abbr: 'ND', salesTax: 5.0, incomeTax: '1.1%–2.9%', suiRate: '0.08%–9.97%', notes: 'Low income tax. Landscaping materials taxable; labor often exempt.' },
  { state: 'Ohio', abbr: 'OH', salesTax: 5.75, incomeTax: '2.765%–3.99%', suiRate: '0.3%–9.4%', notes: 'Municipality taxes (RITA/CCA) apply—up to 3%. Landscaping services taxable.' },
  { state: 'Oklahoma', abbr: 'OK', salesTax: 4.5, incomeTax: '0.25%–4.75%', suiRate: '0.3%–9.2%', notes: 'Local taxes add up to 7%. Landscape labor often exempt.' },
  { state: 'Oregon', abbr: 'OR', salesTax: 0, incomeTax: '4.75%–9.9%', suiRate: '0.9%–5.4%', notes: 'No sales tax. High income tax. Corporate activity tax 0.57% on gross receipts over $1M.' },
  { state: 'Pennsylvania', abbr: 'PA', salesTax: 6.0, incomeTax: '3.07% flat', suiRate: '1.419%–10.5918%', notes: 'Local earned income taxes apply. Philadelphia adds 3.75%. Landscaping services generally not taxable.' },
  { state: 'Rhode Island', abbr: 'RI', salesTax: 7.0, incomeTax: '3.75%–5.99%', suiRate: '1.19%–9.69%', notes: 'Landscaping services taxable. High sales tax rate.' },
  { state: 'South Carolina', abbr: 'SC', salesTax: 6.0, incomeTax: '3%–6.4%', suiRate: '0.06%–5.46%', notes: 'County taxes add 1–3%. Materials taxable; labor often separately stated.' },
  { state: 'South Dakota', abbr: 'SD', salesTax: 4.5, incomeTax: 'None', suiRate: '0%–9.35%', notes: 'No income tax. Landscaping services taxable.' },
  { state: 'Tennessee', abbr: 'TN', salesTax: 7.0, incomeTax: 'None (wages)', suiRate: '0.01%–10%', notes: 'No income tax on wages (investment income 1%). High sales tax. Materials and some services taxable.' },
  { state: 'Texas', abbr: 'TX', salesTax: 6.25, incomeTax: 'None', suiRate: '0.31%–6.31%', notes: 'No income tax. Local taxes add up to 2%. Landscaping materials taxable; labor sometimes.' },
  { state: 'Utah', abbr: 'UT', salesTax: 6.1, incomeTax: '4.65% flat', suiRate: '0.1%–7.2%', notes: 'Flat income tax. Landscaping often taxable as services.' },
  { state: 'Vermont', abbr: 'VT', salesTax: 6.0, incomeTax: '3.35%–8.75%', suiRate: '1%–8.5%', notes: 'Landscaping services taxable. Higher income brackets taxed heavily.' },
  { state: 'Virginia', abbr: 'VA', salesTax: 5.3, incomeTax: '2%–5.75%', suiRate: '0.1%–6.2%', notes: 'Landscaping services not taxable. Materials taxable. Locality taxes add 1%.' },
  { state: 'Washington', abbr: 'WA', salesTax: 6.5, incomeTax: 'None (wages)', suiRate: '0.27%–6%', notes: 'No income tax on wages. 7% capital gains tax (2023+). Business & occupation tax 1.5% on gross revenue.' },
  { state: 'West Virginia', abbr: 'WV', salesTax: 6.0, incomeTax: '2.36%–5.12%', suiRate: '1.5%–8.5%', notes: 'Landscaping materials taxable. Graduated income tax.' },
  { state: 'Wisconsin', abbr: 'WI', salesTax: 5.0, incomeTax: '3.5%–7.65%', suiRate: '0%–12%', notes: 'County adds 0.5%. Landscaping services taxable.' },
  { state: 'Wyoming', abbr: 'WY', salesTax: 4.0, incomeTax: 'None', suiRate: '0.09%–8.5%', notes: 'No income tax. Low overall tax burden. Materials taxable.' },
  { state: 'Washington D.C.', abbr: 'DC', salesTax: 6.0, incomeTax: '4%–10.75%', suiRate: '1.9%–7.4%', notes: 'High income tax. Landscaping services taxable. Business license tax applies.' },
]

// Federal payroll taxes (same for all states)
export const FEDERAL_PAYROLL = {
  socialSecurity: { rate: '6.2%', wage_base: '$176,100 (2025)', note: 'Employee + employer each pay 6.2%' },
  medicare: { rate: '1.45%', note: 'Employee + employer each. Additional 0.9% on wages over $200K' },
  futa: { rate: '6%', credit: 'Up to 5.4% credit if state taxes paid on time (effective 0.6%)', note: 'On first $7,000 per employee' },
  selfEmployment: { rate: '15.3%', note: 'Covers both halves of SS + Medicare. Deduct half on your taxes.' },
}
