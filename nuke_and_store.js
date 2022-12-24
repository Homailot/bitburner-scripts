class RecursiveNuker {
	/**
	 * @param{number} limit
	 */
	constructor(ns, limit) {
		/** 
		 * @type{NS} ns 
		 */
		this.ns = ns
		/**
		 * @type{number} limit
		 */
		this.limit = limit
		/**
		 * @type{Set<String>} previousServers
		 */
		this.previousServers = new Set()
		this.hackedServers = []
		this.portOpeners = new Map([
			[`BruteSSH.exe`, {fn: this.ns.brutessh, property: 'sshPortOpen'}],
			[`FTPCrack.exe`, {fn: this.ns.ftpcrack, property: 'ftpPortOpen'}],
			[`relaySMTP.exe`, {fn: this.ns.relaysmtp, property: 'smtpPortOpen'}],
			[`HTTPWorm.exe`, {fn: this.ns.httpworm, property: 'httpPortOpen'}],
			[`SQLInject.exe`, {fn: this.ns.sqlinject, property: 'sqlPortOpen'}],
		])
	}

	nuke(target) {
		const serverObject = this.ns.getServer(target)

		if(serverObject.hasAdminRights) {
			this.hackedServers.push(target)
			return
		}
		if (serverObject.requiredHackingSkill > this.ns.getHackingLevel()) {
			return
		}

		const remainingPorts = serverObject.numOpenPortsRequired - serverObject.openPortCount
		let openedPorts = 0

		for (const [program, value] of this.portOpeners) {
			if(!serverObject[value.property] && this.ns.fileExists(program)) {
				value.fn(target)
				openedPorts++
			}
		}
		if (openedPorts < remainingPorts) {
			return
		}

		this.ns.nuke(target)
		this.hackedServers.push(target)
	}

	recursiveNuke(target, count) {
		if (count > this.limit) {
			return
		}

		this.nuke(target)

		this.previousServers.add(target)
		let peers = this.ns.scan(target)

		peers.forEach((peer, _, __) => {
			if (!this.previousServers.has(peer)) {
				this.recursiveNuke(peer, count + 1)
			}
		}, this)
	}
}

/** @param {NS} ns */
async function main(ns) {
	ns.disableLog("scan")
	ns.disableLog("getHackingLevel")

	let nuker = new RecursiveNuker(ns, ns.args[0])

	nuker.recursiveNuke('home', 0)

	let availServers = nuker.hackedServers

	availServers.forEach((value) => {
		ns.scp(["hack.js", "weaken.js", "grow.js"], value)
	})

	ns.write("availServers.txt", JSON.stringify(availServers), "w")
}

export {
	main,
	RecursiveNuker
}