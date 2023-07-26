import { Sequence } from './Sequence';
import { Tools } from '../Tools';
import { Serialize } from './Serialize';

type SerializeClassType<T extends typeof Serialize = typeof Serialize> = T;
type SerializeInstance<I extends Serialize = Serialize> = I;
type SequenceInstance<I extends Sequence = Sequence> = I;

export class SerializeManager {
    protected _storage = new Map<string, SerializeClassType>();

    addSerializer(clazz: SerializeClassType): void;
    addSerializer(clazz: SerializeClassType, name: string): void;
    addSerializer(...parameter: any): void {
        if (Tools.hasLength(parameter, 1)) {
            const clazz = parameter[0];
            this._storage.set(clazz.name, clazz);
            return;
        }
        if (Tools.hasLength(parameter, 2)) {
            const clazz = parameter[0];
            const name = parameter[1];
            this._storage.set(name, clazz);
        }
    }

    fromSequence<I extends Serialize>(sequence: object[]): Array<SerializeInstance<I>>;
    fromSequence<I extends Serialize>(sequence: object): SerializeInstance<I>;
    fromSequence<I extends Serialize>(sequence: object | object[]): Array<SerializeInstance<I>> | SerializeInstance<I> {
        if (Tools.isObject<Sequence>(sequence)) {
            const Clazz = this._storage.get(sequence.className!) as typeof Serialize;
            return Clazz.fromSequence(sequence) as SerializeInstance<I>;
        }
        if (Tools.isArray<Sequence>(sequence)) {
            let result = new Array<SerializeInstance<I>>();
            for (let element of sequence) {
                result.push(this.fromSequence(element) as SerializeInstance<I>);
            }
            return result;
        }
        return [];
    }

    toSequence(instance: SerializeInstance[]): SequenceInstance[];
    toSequence(instance: SerializeInstance): SequenceInstance;
    toSequence(instance: SerializeInstance | SerializeInstance[]): SequenceInstance[] | SequenceInstance {
        if (Tools.isObject<SerializeInstance>(instance)) {
            return instance.toSequence();
        }
        if (Tools.isArray<SerializeInstance>(instance)) {
            let result = new Array<SequenceInstance>();
            for (let element of instance) {
                result.push(this.toSequence(element));
            }
            return result;
        }
        return [];
    }

    fromStringifyParse(jsonString: string): SerializeInstance[] | SerializeInstance {
        return this.fromSequence(JSON.parse(jsonString));
    }
}
