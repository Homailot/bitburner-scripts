import { getTotalCost, getTotalUpgradeCost } from "utils/cost_upgrade_server.js"

function calculateNextRam(ns, curRam, percentage, functions) {
	while(functions.totalCost(curRam * 2) < percentage * ns.getServerMoneyAvailable('home')) {
		curRam *= 2
	}

	return curRam
}

/** @param {NS} ns */
function findCurRam(ns) {
	let minRam = ns.getPurchasedServerMaxRam()

	for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
		if (ns.getServerMaxRam('pserver-'+i) < minRam) {
			minRam = ns.getServerMaxRam('pserver-'+i)
		}
	}

	return minRam
}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("getPurchasedServerCost")
	ns.disableLog("getPurchasedServerUpgradeCost")

	var data = ns.flags([
		["percentage", 0.1]
	])

	let purchased = ns.getPurchasedServers().length == 25 
	let ram = purchased ? ns.getServerMaxRam('pserver-0') : 4
	const percentage = data.percentage

	const purchaseFunctions = {
		totalCost: (ram) => getTotalCost(ns, ram),
		cost: ns.getPurchasedServerCost,
		buy: ns.purchaseServer
	}

	const upgradeFunctions = {
		totalCost: (ram) => getTotalUpgradeCost(ns, ram),
		cost: (host, ram) => ns.getPurchasedServerUpgradeCost(host, ram),
		buy: ns.upgradePurchasedServer,
	}

	const functions = {
		totalCost: (ram) => purchased ? upgradeFunctions.totalCost(ram) : purchaseFunctions.totalCost(ram),
		cost: (host, ram) => purchased ? upgradeFunctions.cost(host, ram) : purchaseFunctions.cost(ram),
		buy: (hostname, ram) => purchased ? upgradeFunctions.buy(hostname, ram) : purchaseFunctions.buy(hostname, ram),
	}
	while (true) {
		if (purchased) ram = findCurRam(ns)
		ns.print("ram ", ram)
		let nextRam = calculateNextRam(ns, ram, percentage, functions)
		ns.print("next ",nextRam)
		if (nextRam == ram) {
			await ns.sleep("5000")
			continue;
		}

		ram = nextRam

		let i = 0
		while (i < ns.getPurchasedServerLimit()) {
			let host = 'pserver-' + i

			if (functions.cost(host, ram) <= ns.getServerMoneyAvailable('home')) {
				if(functions.cost(host, ram) > 0) {
					functions.buy(host, ram)
				}

				i++
			} else {
				await ns.sleep("300")
			}
		}

		await ns.sleep("300")
		purchased = true
	}
}