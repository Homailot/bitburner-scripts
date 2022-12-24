/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]
	const serverNames = JSON.parse(ns.read("availServers.txt"))
	
	const runningScripts = []

	for (let i = 0; i < serverNames.length; i++) {
		runningScripts.push([])
	}
	
	while (true) {
		for (let i = 0; i < serverNames.length; i++) {
			let pID = runningScripts[i]
			while (pID.length > 0 && !ns.isRunning(pID[pID.length - 1])) {
				pID.pop()
			}
			if (pID.length > 0) {
				continue
			}

			let servers = analyzeAndSort(ns, serverNames)
			let server = servers[i]
			let threads = Math.floor(server.availRam / ns.getScriptRam("weaken.js"))
			if(threads <= 0) {
				continue
			}

			runningScripts[i] = ns.exec("weaken.js", server.hostname, threads, target)
		}
		await ns.sleep(300)
	}
}

class SimpleServer {
	constructor(hostname, maxRam, usedRam) {
		this.hostname = hostname
		this.maxRam = maxRam
		this.usedRam = usedRam
		this.availRam = maxRam - usedRam
	}
}


/** 
 * @param {NS} ns 
 * @param {Array<String>} serverNames
 * 
 * @returns {Array<SimpleServer>}
 */
function analyzeAndSort(ns, serverNames) {
	return serverNames.map((value) => {
		return new SimpleServer(value, ns.getServerMaxRam(value), ns.getServerUsedRam(value))
	})
}