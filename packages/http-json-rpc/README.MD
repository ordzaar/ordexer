This package is a fork of https://github.com/Insidexa/nestjs-rpc with additional modifications.
Implemented JSON RPC [specification](https://www.jsonrpc.org/specification)

## Contents

- [How to use multiple handlers in one class](#multi-handlers-in-class)
  - [Create handlers](#create-multiple-handlers)
  - [Add to providers](#add-multiple-handler-provider)
  - [Test with curl](#test-multiple-handler-curl)
- [Decorators description](#decorators-description)
- [Samples](#samples)
- [Changelog](#changelog)

### <a id="import-module"></a> Import module

Import module `RpcModule` from `@ordzaar/http-json-rpc`, example

```typescript
JsonRpcModule.forRoot({
  path: "/rpc", // path to RPC
});
```

### <a id="multi-handlers-in-class"></a> How to use multiple handlers in one class

Create multiple RPC handler in one class

#### <a id="create-multiple-handlers"></a> Create handlers

Create RPC class handler

```typescript
import { RpcId, RpcPayload, RpcVersion, RpcMethod, RpcMethodHandler, RpcHandler } from "@ordzaar/http-json-rpc";

@RpcHandler({
  method: "contact",
})
export class ContactHandler {
  @RpcMethodHandler("add")
  public async add(
    @RpcPayload() payload: Payload,
    @RpcVersion() version: string,
    @RpcId() id: number | string,
    @RpcMethod() method: string,
  ) {
    return payload;
  }

  @RpcMethodHandler("delete")
  public async delete(
    @RpcPayload() payload: Payload,
    @RpcVersion() version: string,
    @RpcId() id: number | string,
    @RpcMethod() method: string,
  ) {
    return payload;
  }
}
```

#### <a id="add-multiple-handler-provider"></a> Add to providers

Add `ContactHandler` to providers array

#### <a id="test-multiple-handler-curl"></a> Test with cURL

Every request to RPC is POST method and response status = 200

Test with curl `contact.add`

```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "contact.add", "id": 2}'
```

Test with curl `contact.delete`

```bash
curl -X POST "http://localhost:3000/rpc" -H "accept: application/json" -H "Content-Type: application/json" -d '{"jsonrpc": "2.0", "method": "contact.delete", "id": 2}'
```

### Decorators description

| field     | decorator       | description             | required | other                                                           |
| --------- | --------------- | ----------------------- | -------- | --------------------------------------------------------------- |
| `params`  | `@RpcPayload()` | get payload ( params )  | false    | use pipes...                                                    |
| `jsonrpc` | `@RpcVersion()` | get rpc version         | true     | use pipes...                                                    |
| `method`  | `@RpcMethod()`  | get rpc version         | true     | use pipes...                                                    |
| `id`      | `@RpcId()`      | get client operation id | false    | if not send - response not send, RPC notification. use pipes... |
