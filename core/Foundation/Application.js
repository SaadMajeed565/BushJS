"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const path_1 = __importDefault(require("path"));
const Container_1 = require("../Container/Container");
const Router_1 = require("../Http/Router");
const Kernel_1 = require("../Http/Kernel");
const Kernel_2 = require("../Console/Kernel");
const Connection_1 = require("../Database/Connection");
const GracefulShutdown_1 = require("./GracefulShutdown");
const Config_1 = require("../Config/Config");
const Storage_1 = require("../Storage/Storage");
class Application {
    constructor(options = {}) {
        this.graphqlRoutes = [];
        this.socketRoutes = [];
        this.basePath = options.basePath ?? process.cwd();
        Storage_1.Storage.init(this.basePath, Config_1.config.filesystems);
        this.container = new Container_1.Container();
        this.router = new Router_1.Router();
        this.database = new Connection_1.Connection(options.databaseUrl);
        this.httpKernel = new Kernel_1.HttpKernel(this);
        this.consoleKernel = new Kernel_2.ConsoleKernel(this);
        this.registerBaseBindings();
        (0, GracefulShutdown_1.setupGracefulShutdown)();
    }
    get expressApp() {
        return this.httpKernel.expressApp;
    }
    registerBaseBindings() {
        this.container.singleton('app', () => this);
        this.container.singleton('router', () => this.router);
        this.container.singleton('http.kernel', () => this.httpKernel);
        this.container.singleton('console.kernel', () => this.consoleKernel);
        this.container.singleton('database', () => this.database);
        this.container.singleton('filesystem', () => {
            const m = Storage_1.Storage.getManager();
            if (!m) {
                throw new Error('Filesystem manager is not initialized.');
            }
            return m;
        });
        this.container.singleton('gate', () => require('../Auth/Gate').gate);
    }
    basePathTo(pathSegment) {
        return path_1.default.join(this.basePath, pathSegment);
    }
    route(method, routePath, action, middleware = []) {
        this.router.register(method, routePath, action, middleware);
        return this;
    }
    get(routePath, action, middleware = []) {
        return this.route('GET', routePath, action, middleware);
    }
    post(routePath, action, middleware = []) {
        return this.route('POST', routePath, action, middleware);
    }
    middleware(middleware) {
        this.httpKernel.middleware.push(middleware);
        return this;
    }
    group(options, callback) {
        this.router.group(options, callback);
        return this;
    }
    graphql(path, schema, rootValue = {}, middleware = []) {
        this.graphqlRoutes.push({ path, schema, rootValue, middleware });
        return this;
    }
    socket(path, handler, middleware = []) {
        this.socketRoutes.push({ path, handler, middleware });
        return this;
    }
    getGraphQLRoutes() {
        return this.graphqlRoutes;
    }
    getSocketRoutes() {
        return this.socketRoutes;
    }
    async listen(port = 3000) {
        await this.httpKernel.listen(port);
    }
    async runConsole(argv = []) {
        await this.consoleKernel.handle(argv);
    }
}
exports.Application = Application;
//# sourceMappingURL=Application.js.map