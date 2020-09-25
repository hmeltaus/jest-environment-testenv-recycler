const NodeEnvironment = require("jest-environment-node")
const r = require("testenv-recycler")

const isInteger = (str) => /^\+?(0|[1-9]\d*)$/.test(str)

class TestEnvRecyclerEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context)
    this.docblockPragmas = context.docblockPragmas
    this.testPath = context.testPath
  }

  async setup() {
    console.log("================= Setup =================")
    await super.setup()

    this.recycler = new r.Recycler({
      hostname: this.global.process.env.RECYCLER_HOSTNAME,
      basePath: this.global.process.env.RECYCLER_BASEPATH,
      username: this.global.process.env.RECYCLER_USERNAME,
      password: this.global.process.env.RECYCLER_PASSWORD,
    })

    const countStr = this.docblockPragmas["testenv-recycler-count"] || "1"
    if (!isInteger(countStr)) {
      console.log("@testenv-recycler-count must be a positive integer")
      throw new Error(`@testenv-recycler-count must be a positive integer`)
    }

    const count = parseInt(countStr, 10)
    const name = this.testPath

    try {
      await this.recycler.login()
    } catch (e) {
      console.log("Failed to log in", e)
      throw e
    }

    console.log("logged in")

    try {
      this.global.reservation = await this.recycler.createReservation({
        name,
        count,
      })
    } catch (e) {
      console.log("Failed to create a reservation", e)
      throw e
    }
    console.log("Made reservaation")

    console.log("global:", this.global)
  }

  async teardown() {
    console.log("================= Teardown =================")
    console.log("global:", this.global)
    if (!this.global.reservation) {
      await this.recycler.releaseReservation(this.global.reservation.id)
    }
    await super.teardown()
  }
}

module.exports = TestEnvRecyclerEnvironment
