/** @param {NS} ns */
export async function main(ns) {
	let servers = JSON.parse(ns.read("availServers.txt"))

	servers.forEach((value, _, __) => {
		ns.killall(value)
	})
}