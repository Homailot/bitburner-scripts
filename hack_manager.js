/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep")
	ns.disableLog("getServerMaxMoney")
	ns.disableLog("getServerMinSecurityLevel")
	ns.disableLog("getServerSecurityLevel")
	ns.disableLog("getServerMoneyAvailable")
	ns.disableLog("getServerMaxRam")
	ns.disableLog("getServerUsedRam")
	ns.disableLog("getScriptRam")

	const hackManager = new HackManager(ns)
	await hackManager.run(ns)
}

class HackManager {
	/** @param {NS} ns */
	constructor(ns) {
		this.targets = JSON.parse(ns.read("targets.txt"))
		this.data = ns.flags([
			['share', false],
			['analytics', true]
		])

		this.serverNames = JSON.parse(ns.read("availServers.txt"))
		this.runningScripts = []

		for (let i = 0; i < this.targets.length; i++) {
			this.runningScripts.push([])
		}

		this.moneyPercent = ns.args[0]
		this.securityMin = ns.args[1]
	}

	/** @param {NS} ns */
	async run(ns) {
		if (this.data.share) {
			const ram = ns.getServerMaxRam('home') - ns.getServerUsedRam('home')
			const threads = Math.floor(ram / ns.getScriptRam('share.js'))

			ns.run('share.js', threads)
		}

		if(this.data.analytics) {
			ns.run('analytics.js')
		}

		while (true) {
			gatherAnalytics(ns, this.serverNames)

			for (let i = 0; i < this.targets.length; i++) {
				this.hackTarget(ns, i)
			}
			await ns.sleep(300)
		}
	}

	/** @param {NS} ns */
	async hackTarget(ns, i) {
		let pID = this.runningScripts[i]
		while (pID.length > 0 && !ns.isRunning(pID[pID.length - 1])) {
			pID.pop()
		}
		if (pID.length > 0) {
			return
		}

		let target = this.targets[i]

		let servers = analyzeAndSort(ns, this.serverNames)

		let moneyThresh = ns.getServerMaxMoney(target) * this.moneyPercent
		let securityThresh = ns.getServerMinSecurityLevel(target) + this.securityMin
		let securityLevel = ns.getServerSecurityLevel(target)
		let money = ns.getServerMoneyAvailable(target)

		if (securityLevel > securityThresh) {
			let threads = Math.ceil(
				(securityLevel - ns.getServerMinSecurityLevel(target)) * 20
			)

			this.runningScripts[i] = findAndRun(ns, "weaken.js", threads, servers, target)
		} else if (money < moneyThresh) {
			let threads = Math.ceil(
				ns.growthAnalyze(target, ns.getServerMaxMoney(target) / money)
			)

			this.runningScripts[i] = findAndRun(ns, "grow.js", threads, servers, target)
		} else {
			let threads = Math.ceil(ns.hackAnalyzeThreads(
				target, 0.5 * ns.getServerMaxMoney(target)
			))

			this.runningScripts[i] = findAndRun(ns, "hack.js", threads, servers, target)
		}
	}
}


/** @param {NS} ns */
function gatherAnalytics(ns) {
	const analyticsString = ns.read('analytics.txt')
	let analyticsData
	if (analyticsString === undefined || analyticsString === null || analyticsString === "") {
		analyticsData = {}
	} else {
		analyticsData = JSON.parse(analyticsString)
	}


	let data
	while ((data = ns.readPort(1)) != "NULL PORT DATA") {
		let dto = JSON.parse(data)

		if (analyticsData[dto.target] === undefined) {
			analyticsData[dto.target] = {}
			analyticsData[dto.target].totalHacked = dto.value
		} else if (analyticsData[dto.target].value === undefined) {
			analyticsData[dto.target].totalHacked = dto.value
		} else {
			analyticsData[dto.target].totalHacked += dto.value
		}
	}

	ns.write('analytics.txt', JSON.stringify(analyticsData), "w")
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

/** 
 * @param {NS} ns 
 * @param {Array<SimpleServer>} servers
 * 
 */
function findAndRun(ns, file, threads, servers, target) {
	const scriptRam = ns.getScriptRam(file)
	const pID = []

	ns.print(`Finding servers to run ${file} using ${threads} threads...`)

	for (let i = 0; i < servers.length && threads > 0; i++) {
		let serverThreads = Math.floor(servers[i].availRam / scriptRam)
		if (serverThreads == 0) {
			continue
		}

		if (serverThreads > threads) {
			serverThreads = threads
			threads = 0
		} else {
			threads -= serverThreads
		}
		pID.push(ns.exec(file, servers[i].hostname, serverThreads, target))
	}

	return pID
}