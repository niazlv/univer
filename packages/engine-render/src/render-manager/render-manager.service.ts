/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Nullable, UnitModel, UnitType } from '@univerjs/core';
import { Disposable, IUniverInstanceService, toDisposable } from '@univerjs/core';
import type { IDisposable } from '@wendellhu/redi';
import { createIdentifier, Inject, Injector } from '@wendellhu/redi';
import type { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import type { BaseObject } from '../base-object';
import type { DocComponent } from '../components/docs/doc-component';
import type { SheetComponent } from '../components/sheets/sheet-component';
import type { Slide } from '../components/slides/slide';
import { Engine } from '../engine';
import { Scene } from '../scene';
import { type IRender, type IRenderControllerCtor, RenderUnit } from './render-unit';

export type RenderComponentType = SheetComponent | DocComponent | Slide | BaseObject;

export interface IRenderManagerService extends IDisposable {
    currentRender$: Observable<Nullable<string>>;
    createRender$: Observable<Nullable<string>>;
    createRender(unitId: string): IRender;
    removeRender(unitId: string): void;
    setCurrent(unitId: string): void;
    getRenderById(unitId: string): Nullable<IRender>;
    getRenderAll(): Map<string, IRender>;
    defaultEngine: Engine;
    create(unitId: Nullable<string>): void;
    getCurrent(): Nullable<IRender>;
    getFirst(): Nullable<IRender>;
    has(unitId: string): boolean;

    registerRenderController<T extends UnitModel>(type: UnitType, ctor: IRenderControllerCtor<T>): IDisposable;
}

const DEFAULT_SCENE_SIZE = { width: 1500, height: 1000 };

const SCENE_NAMESPACE = '_UNIVER_SCENE_';


export class RenderManagerService extends Disposable implements IRenderManagerService {
    private _defaultEngine!: Engine;

    private _currentUnitId: string = '';

    private _renderMap: Map<string, IRender> = new Map();

    private readonly _currentRender$ = new BehaviorSubject<Nullable<string>>(this._currentUnitId);
    readonly currentRender$ = this._currentRender$.asObservable();

    private readonly _createRender$ = new BehaviorSubject<Nullable<string>>(this._currentUnitId);
    readonly createRender$ = this._createRender$.asObservable();

    get defaultEngine() {
        if (!this._defaultEngine) {
            this._defaultEngine = new Engine();
        }
        return this._defaultEngine;
    }

    private readonly _renderControllers = new Map<UnitType, Set<IRenderControllerCtor>>();

    constructor(
        @Inject(Injector) private readonly _injector: Injector,
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService
    ) {
        super();
    }

    override dispose() {
        super.dispose();

        this._renderMap.forEach((item) => {
            this._disposeItem(item);
        });

        this._renderControllers.clear();
        this._renderMap.clear();

        this._currentRender$.complete();
    }

    registerRenderController(type: UnitType, ctor: IRenderControllerCtor): IDisposable {
        if (!this._renderControllers.has(type)) {
            this._renderControllers.set(type, new Set());
        }

        const set = this._renderControllers.get(type)!;
        set.add(ctor);

        for (const [renderUnitId, render] of this._renderMap) {
            const renderType = this._univerInstanceService.getUnitType(renderUnitId);
            if (renderType === type) {
                (render as RenderUnit).addRenderControllers([ctor]);
            }
        }

        return toDisposable(() => set.delete(ctor));
    }

    private _getRenderControllersForType(type: UnitType): Array<IRenderControllerCtor> {
        return Array.from(this._renderControllers.get(type) ?? []);
    }

    createRenderWithEngine(unitId: string, engine: Engine): IRender {
        return this._createRender(unitId, engine, false);
    }

    create(unitId: Nullable<string>) {
        this._createRender$.next(unitId);
    }

    createRender(unitId: string): IRender {
        return this._createRender(unitId, new Engine());
    }

    private _createRender(unitId: string, engine: Engine, isMainScene: boolean = true): IRender {
        const existItem = this.getRenderById(unitId);
        let shouldDestroyEngine = true;

        if (existItem != null) {
            const existEngine = existItem.engine;
            if (existEngine === engine) {
                shouldDestroyEngine = false;
            }
        }

        this._disposeItem(existItem, shouldDestroyEngine);

        const { width, height } = DEFAULT_SCENE_SIZE;

        const scene = new Scene(SCENE_NAMESPACE + unitId, engine, {
            width,
            height,
        });

        const unit = this._univerInstanceService.getUnit(unitId)!;
        let renderUnit: IRender;

        if (unit) {
            const type = this._univerInstanceService.getUnitType(unitId);
            const ctors = this._getRenderControllersForType(type);
            renderUnit = new RenderUnit(this._injector, {
                unit,
                engine,
                scene,
                isMainScene,
            });

            (renderUnit as RenderUnit).addRenderControllers(ctors);
        } else {
            // For slide pages
            renderUnit = {
                unitId,
                engine,
                scene,
                mainComponent: null,
                components: new Map(),
                isMainScene,
                // @ts-ignore
                with(_dependency) {
                    return null;
                },
            };
        }

        this._addRenderUnit(unitId, renderUnit);
        return renderUnit;
    }

    private _addRenderUnit(unitId: string, item: IRender) {
        this._renderMap.set(unitId, item);
    }

    removeRender(unitId: string) {
        const item = this._renderMap.get(unitId);
        if (item != null) {
            this._disposeItem(item);
        }

        this._renderMap.delete(unitId);
    }

    has(unitId: string) {
        return this._renderMap.has(unitId);
    }

    setCurrent(unitId: string) {
        this._currentUnitId = unitId;

        this._currentRender$.next(unitId);
    }

    getCurrent() {
        return this._renderMap.get(this._currentUnitId);
    }

    getFirst() {
        return [...this.getRenderAll().values()][0];
    }

    getRenderById(unitId: string): Nullable<IRender> {
        return this._renderMap.get(unitId);
    }

    getRenderAll() {
        return this._renderMap;
    }

    private _disposeItem(item: Nullable<IRender>, shouldDestroyEngine: boolean = true) {
        if (item == null) {
            return;
        }

        const { engine, scene, components } = item;

        // `mainComponent` is one of the `components` so it does not to be disposed again
        components?.forEach((component) => component.dispose());
        scene.dispose();

        if (isDisposable(item)) {
            item.dispose();
        }

        if (shouldDestroyEngine) {
            engine.dispose();
        }
    }
}

export const IRenderManagerService = createIdentifier<IRenderManagerService>('engine-render.render-manager.service');

export function isDisposable(thing: unknown): thing is IDisposable {
  // eslint-disable-next-line ts/no-explicit-any
    return !!thing && typeof (thing as any).dispose === 'function';
}
