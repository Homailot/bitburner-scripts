/** @param {NS} ns */
function getTotalUpgradeCost(ns, ram) {
	return ns.getPurchasedServerUpgradeCost('pserver-0', ram) * ns.getPurchasedServerLimit()
}

/** @param {NS} ns */
function getTotalCost(ns, ram) {
	return ns.getPurchasedServerCost(ram) * ns.getPurchasedServerLimit()
}

/** @param {NS} ns */
async function main(ns) {
	const cost = ns.getPurchasedServerUpgradeCost('pserver-0', ns.args[0])
	const totalCost = getTotalUpgradeCost(ns, ns.args[0])

	ns.tprint(`COST IS ${cost}\nTOTAL COST IS ${totalCost}`)
}

export {
	main,
	getTotalUpgradeCost,
	getTotalCost,
}