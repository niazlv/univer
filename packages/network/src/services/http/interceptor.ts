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

import type { Observable } from 'rxjs';

import type { HTTPRequest } from './request';
import type { HTTPEvent } from './response';

export type HTTPHandlerFn = (request: HTTPRequest) => Observable<HTTPEvent<unknown>>;
export type HTTPInterceptorFn = (request: HTTPRequest, next: HTTPHandlerFn) => Observable<HTTPEvent<unknown>>;
export type RequestPipe<T> = (req: HTTPRequest, finalHandlerFn: HTTPHandlerFn) => Observable<HTTPEvent<T>>;
