/** @param {NS} ns */
export async function main(ns) {
	const target = ns.args[0]
	const value = await ns.hack(target)

	while(!ns.tryWritePort(1, JSON.stringify({target, value}))) {
		await ns.sleep(100)
	}
}