class ServerData {
	constructor(server, data) {
		/** @type{string} */
		this.server = server

		if (data[server] === undefined) {
			this.totalHacked = 0
		} else {
			this.totalHacked = data[server].totalHacked ?? 0
		}
	}
}

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("getServerMoneyAvailable")
	ns.disableLog("getServerMaxMoney")
	ns.disableLog("getServerSecurityLevel")
	ns.disableLog("getServerMinSecurityLevel")

	while (true) {
		const analyticsString = ns.read('analytics.txt')
		/** @type {string[]} */
		const serverNames = JSON.parse(ns.read("targets.txt"))

		let analyticsData
		if (analyticsString === undefined || analyticsString === null || analyticsString === "") {
			analyticsData = {}
		} else {
			analyticsData = JSON.parse(analyticsString)
		}

		const servers = serverNames.map((value) => {
			return new ServerData(value, analyticsData)
		}).sort((a, b) => {
			return b.totalHacked - a.totalHacked
		})

		const formatter = new Intl.NumberFormat('en-IN', { style:'currency', currency: "USD" })

		const headers = [
			{
				title: 'SERVER NAME',
				property: (target) => target.server
			},
			{
				title: 'MIN SEC',
				property: (target) => `${ns.getServerMinSecurityLevel(target.server).toFixed(2)}`
			},
			{
				title: 'SECURITY',
				property: (target) => `${ns.getServerSecurityLevel(target.server).toFixed(2)}`
			},
			{
				title: 'MAX MONEY',
				property: (target) => formatter.format(ns.getServerMaxMoney(target.server))
			},
			{
				title: 'MONEY %',
				property: (target) => `${(ns.getServerMoneyAvailable(target.server) / ns.getServerMaxMoney(target.server) * 100).toFixed(2)} %`
			},
			{
				title: 'TOTAL HACKED',
				property: (target) => formatter.format(target.totalHacked)
			},
		]

		let headerString = ""
		for (let header of headers) {
			let maxSize = 0
			let results = []

			for(let target of servers) {
				/** @type {string} */
				let result = header.property(target)
				results.push(result)

				if (result.length > maxSize) {
					maxSize = result.length
				}
			}

			header.results = results
			let title = header.title.padStart(maxSize + 1)
			header.colSize = title.length
			headerString = headerString.concat(title, " | ")
		}
		ns.print(headerString)

		for (let i = 0; i < servers.length; i++) {
			let row = ""
			for (let header of headers) {
				row = row.concat(header.results[i].padStart(header.colSize), " | ")
			}
			ns.print(row)
		}

		await ns.sleep(1000)
	}
}