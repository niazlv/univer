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

import type { Dependency } from '@wendellhu/redi';
import { Injector } from '@wendellhu/redi';

import { DocumentDataModel } from './docs/data-model/document-data-model';
import { CommandService, ICommandService } from './services/command/command.service';
import { ConfigService, IConfigService } from './services/config/config.service';
import { ContextService, IContextService } from './services/context/context.service';
import { ErrorService } from './services/error/error.service';
import {
    FloatingObjectManagerService,
    IFloatingObjectManagerService,
} from './services/floating-object/floating-object-manager.service';
import { IUniverInstanceService, UniverInstanceService } from './services/instance/instance.service';
import { LifecycleStages } from './services/lifecycle/lifecycle';
import { LifecycleInitializerService, LifecycleService } from './services/lifecycle/lifecycle.service';
import { LocaleService } from './services/locale/locale.service';
import { DesktopLogService, ILogService } from './services/log/log.service';
import { PermissionService } from './services/permission/permission.service';
import { IPermissionService } from './services/permission/type';

import { ResourceManagerService } from './services/resource-manager/resource-manager.service';
import { IResourceManagerService } from './services/resource-manager/type';
import { ResourceLoaderService } from './services/resource-loader/resource-loader.service';
import { IResourceLoaderService } from './services/resource-loader/type';
import { ThemeService } from './services/theme/theme.service';
import { IUndoRedoService, LocalUndoRedoService } from './services/undoredo/undoredo.service';
import { Workbook } from './sheets/workbook';
import { SlideDataModel } from './slides/slide-model';
import type { LocaleType } from './types/enum/locale-type';
import type { IDocumentData, ISlideData, IUniverData, IWorkbookData } from './types/interfaces';
import type { UnitModel, UnitType } from './common/unit';
import { UniverInstanceType } from './common/unit';
import { PluginService } from './services/plugin/plugin.service';
import type { Plugin, PluginCtor } from './services/plugin/plugin';
import type { DependencyOverride } from './services/plugin/plugin-override';
import { mergeOverrideWithDependencies } from './services/plugin/plugin-override';
import { UserManagerService } from './services/user-manager/user-manager.service';
import { AuthzIoMockService } from './services/authz-io';
import { IAuthzIoService } from './services/authz-io/type';

export class Univer {
    private _startedTypes = new Set<UnitType>();
    private _injector: Injector;

    private get _univerInstanceService(): IUniverInstanceService {
        return this._injector.get(IUniverInstanceService);
    }

    private get _pluginService(): PluginService {
        return this._injector.get(PluginService);
    }

    /**
     * Create a Univer instance.
     * @param config Configuration data for Univer
     * @param parentInjector An optional parent injector of the Univer injector. For more information, see https://redi.wendell.fun/docs/hierarchy.
     */
    constructor(config: Partial<IUniverData> = {}, parentInjector?: Injector) {
        const injector = this._injector = createUniverInjector(parentInjector, config?.override);

        const { theme, locale, locales, logLevel } = config;

        theme && this._injector.get(ThemeService).setTheme(theme);
        locales && this._injector.get(LocaleService).load(locales);
        locale && this._injector.get(LocaleService).setLocale(locale);
        logLevel && this._injector.get(ILogService).setLogLevel(logLevel);

        this._init(injector);
        const _a = this._pluginService;
    }

    __getInjector(): Injector {
        return this._injector;
    }

    dispose(): void {
        this._injector.dispose();
    }

    setLocale(locale: LocaleType) {
        this._injector.get(LocaleService).setLocale(locale);
    }

    createUnit<T, U extends UnitModel>(type: UnitType, data: Partial<T>): U {
        return this._univerInstanceService.createUnit(type, data);
    }

    /**
     * Create a univer sheet instance with internal dependency injection.
     *
     * @deprecated use `createUnit` instead
     */
    createUniverSheet(data: Partial<IWorkbookData>): Workbook {
        return this._univerInstanceService.createUnit<IWorkbookData, Workbook>(UniverInstanceType.UNIVER_SHEET, data);
    }

    /**
     * @deprecated use `createUnit` instead
     */
    createUniverDoc(data: Partial<IDocumentData>): DocumentDataModel {
        return this._univerInstanceService.createUnit<IDocumentData, DocumentDataModel>(UniverInstanceType.UNIVER_DOC, data);
    }

    /**
     * @deprecated use `createUnit` instead
     */
    createUniverSlide(data: Partial<ISlideData>): SlideDataModel {
        return this._univerInstanceService.createUnit<ISlideData, SlideDataModel>(UniverInstanceType.UNIVER_SLIDE, data);
    }

    private _init(injector: Injector): void {
        this._univerInstanceService.registerCtorForType(UniverInstanceType.UNIVER_SHEET, Workbook);
        this._univerInstanceService.registerCtorForType(UniverInstanceType.UNIVER_DOC, DocumentDataModel);
        this._univerInstanceService.registerCtorForType(UniverInstanceType.UNIVER_SLIDE, SlideDataModel);

        const univerInstanceService = injector.get(IUniverInstanceService) as UniverInstanceService;
        univerInstanceService.__setCreateHandler(
            (type: UnitType, data, ctor) => {
                if (!this._startedTypes.has(type)) {
                    this._pluginService.startPluginForType(type);
                    this._startedTypes.add(type);

                    const model = injector.createInstance(ctor, data);
                    univerInstanceService.__addUnit(model);

                    this._tryProgressToReady();

                    return model;
                }

                const model = injector.createInstance(ctor, data);
                univerInstanceService.__addUnit(model);
                return model;
            }
        );
    }

    private _tryProgressToReady(): void {
        const lifecycleService = this._injector.get(LifecycleService);
        if (lifecycleService.stage < LifecycleStages.Ready) {
            this._injector.get(LifecycleService).stage = LifecycleStages.Ready;
        }
    }


    /** Register a plugin into univer. */
    registerPlugin<T extends PluginCtor<Plugin>>(plugin: T, config?: ConstructorParameters<T>[0]): void {
        this._pluginService.registerPlugin(plugin, config);
    }
}

function createUniverInjector(parentInjector?: Injector, override?: DependencyOverride) {
    const dependencies: Dependency[] = mergeOverrideWithDependencies([
        [ErrorService],
        [LocaleService],
        [ThemeService],
        [LifecycleService],
        [LifecycleInitializerService],
        [PluginService],
        [UserManagerService],

        // abstract services
        [IUniverInstanceService, { useClass: UniverInstanceService }],
        [IPermissionService, { useClass: PermissionService }],
        [ILogService, { useClass: DesktopLogService, lazy: true }],
        [ICommandService, { useClass: CommandService, lazy: true }],
        [IUndoRedoService, { useClass: LocalUndoRedoService, lazy: true }],
        [IConfigService, { useClass: ConfigService }],
        [IContextService, { useClass: ContextService }],
        [IFloatingObjectManagerService, { useClass: FloatingObjectManagerService, lazy: true }],
        [IResourceManagerService, { useClass: ResourceManagerService, lazy: true }],
        [IResourceLoaderService, { useClass: ResourceLoaderService, lazy: true }],
        [IAuthzIoService, { useClass: AuthzIoMockService, lazy: true }],
    ], override);

    return parentInjector ? parentInjector.createChild(dependencies) : new Injector(dependencies);
}
