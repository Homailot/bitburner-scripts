/** @param {NS} ns */
function buyNode(ns, money) {
	ns.print(`buying a node with ${money}€`)
	if (ns.hacknet.getPurchaseNodeCost() < money) {
		return ns.hacknet.purchaseNode()
	}

	return -1
}

function applyUpgrade(ns, node, money, upgrade) {
	let availMoney = money
	let count = 0

	while (availMoney > 0) {
		let cost = upgrade.cost(node)
		if (cost > availMoney) {
			break
		}

		upgrade.upgrade(node)

		availMoney -= cost
		count++;
	}
	ns.print(`upgrading node ${node} with ${upgrade.upgrade} with ${count} and ${money}€`)
}

/** @param {NS} ns */
function whichUpgrades(ns) {
	const upgrades = [
		{
			cost: (node) => ns.hacknet.getLevelUpgradeCost(node, 1),
			upgrade: (node) => ns.hacknet.upgradeLevel(node, 1),
		},
		{
			cost: (node) => ns.hacknet.getRamUpgradeCost(node, 2),
			upgrade: (node) => ns.hacknet.upgradeRam(node, 2),
		},
		{
			cost: (node) => ns.hacknet.getCoreUpgradeCost(node, 1),
			upgrade:(node) => ns.hacknet.upgradeCore(node, 1),
		},
	]
	const actions = []

	for (let node = 0; node < ns.hacknet.numNodes(); node++) {
		upgrades.forEach((upgrade) => {
			if (upgrade.cost(node) !== Infinity) {
				actions.push((ns, money) => applyUpgrade(ns, node, money, upgrade))
			}
		})
	}

	return actions
}


/** @param {NS} ns */
export async function main(ns) {
	const hacknet = ns.hacknet
	const data = ns.flags([
		["percentage", 0.05]
	])
	const percentage = data.percentage

	while (true) {
		let availMoney = percentage * ns.getServerMoneyAvailable('home')
		let actions = hacknet.numNodes() == hacknet.maxNumNodes() ? [] : [buyNode]
		actions = [...actions, ...whichUpgrades(ns)]

		let dividedMoney = availMoney / actions.length

		actions.forEach((fn) => {
			fn(ns, dividedMoney)
		})

		await ns.sleep("10000")
	}
}