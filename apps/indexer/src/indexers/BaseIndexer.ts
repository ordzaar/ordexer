export abstract class BaseIndexer {
    protected readonly name: string;

    constructor(name: string) {
        this.name = name;
    }
    
    abstract start(height: number): Promise<void>;
    abstract reorg(height: number): Promise<void>;
}

