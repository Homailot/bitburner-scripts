/** @param {NS} ns */
export async function main(ns) {
	let servers = JSON.parse(ns.read("availServers.txt"))
	/**
	 * @type {Array<Server>}
	 */
	let serverObj = []

	servers.forEach((value) => {
		serverObj.push(ns.getServer(value))
	})

	serverObj.sort((a, b) => {
		return b.moneyMax - a.moneyMax
	})

	serverObj.forEach((value) => {
		ns.tprint(`${value.hostname}: growth is ${value.serverGrowth}, min sec is ${ns.getServerMinSecurityLevel(value.hostname)}, max value is ${value.moneyMax}, hack is ${value.requiredHackingSkill}`)
	})

	servers = serverObj.map((value) => {
		return value.hostname
	})

	ns.write("best_servers.txt", JSON.stringify(servers), "w")
}