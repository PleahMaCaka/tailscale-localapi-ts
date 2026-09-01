export type {
  AuthKey,
  CreateAuthKeyOptions,
  KeyOps,
  NodeOps,
  PolicyDocument,
  PolicyOps,
  TailnetNode,
  TailnetUser,
  UserOps
} from "@tailnet/core"
export {
  ApiError,
  ConflictError,
  InvalidRequestError,
  NotFoundError,
  ServerUnreachableError,
  Tailnet,
  TailnetError,
  UnauthorizedError
} from "@tailnet/core"
export { TailscaleDeviceOps } from "./managers/devices"
export { TailscaleDnsOps } from "./managers/dns"
export { TailscaleKeyOps } from "./managers/keys"
export { TailscalePolicyOps } from "./managers/policy"
export { TailscaleUserOps } from "./managers/users"
export { Tailscale } from "./tailscale"
export type * from "./types"
