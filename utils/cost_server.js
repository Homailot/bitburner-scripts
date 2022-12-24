/** @param {NS} ns */
export async function main(ns) {
	const cost = ns.getPurchasedServerCost(ns.args[0])

	ns.tprint(`COST IS ${cost}\nTOTAL COST IS ${cost*ns.getPurchasedServerLimit()}`)
}