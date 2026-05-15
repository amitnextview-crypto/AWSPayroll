const config = require('./salary-config');

function calculateAnnualTDS(annualTaxable) {
    let remaining = annualTaxable;
    let tax = 0;
    let lower = 0;
    for (let i = 0; i < config.TDS_SLABS.length; i++) {
        const slab = config.TDS_SLABS[i];
        const cap = slab.upto;
        const slabAmount = Math.max(0, Math.min(cap - lower, remaining));
        if (slabAmount > 0) {
            tax += slabAmount * slab.rate;
            remaining -= slabAmount;
        }
        lower = cap;
        if (remaining <= 0) break;
    }
    return Math.max(0, tax);
}

module.exports = { calculateAnnualTDS };
