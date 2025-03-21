// @ts-check
import {expect, test} from '@playwright/test';

/**
 * Playwright Page
 * @typedef {import('@playwright/test').APIResponse} APIResponse
 */

const url = 'api.php/admin';

/**
 * Check for a JSON response about the metadata
 * @param {APIResponse} response The response object
 * @returns {Promise<any>} The JSON response
 */
export async function checkJson(response) {
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/json');
    return await response.json();
}

test.describe('Not connected',
    {
        tag: ['@requests', '@readonly'],
    }, () => {

        test('GET', async ({request}) => {
            const response = await request.get(url + "/repositories", {});
            expect(response.status()).toBe(401)
        });

        test('PUT', async ({request}) => {
            const response = await request.put(url + "/repositories", {});
            expect(response.status()).toBe(501)
        });
    }
);

test.describe('Connected',
    {
        tag: ['@requests', '@readonly'],
    }, () => {

        test('GET repositories', async ({request}) => {
            const response = await request.get(url + "/repositories",
                {
                    headers: {
                        authorization: 'Basic YWRtaW46YWRtaW4='
                    }
                });

            const json = await checkJson(response);

            expect(json[0].key).toBeDefined();
            expect(json[0].label).toBeDefined();
            expect(json[0].path).toBeDefined();
        });

        test('GET specific repository wrong key', async ({request}) => {
            const response = await request.get(url + "/repositories/test",
                {
                    headers: {
                        authorization: 'Basic YWRtaW46YWRtaW4='
                    }
                });

            expect(response.status()).toBe(404)
        });

        test('GET specific repository good key', async ({request}) => {
            const response = await request.get(url + "/repositories/testsrepository",
                {
                    headers: {
                        authorization: 'Basic YWRtaW46YWRtaW4='
                    }
                });

            const json = await checkJson(response);

            expect(json.key).toBe("testsrepository");
            expect(json.label).toBe("Tests repository");
            expect(json.path).toBe("tests/");
            expect(json.allowUserDefinedThemes).toBeTruthy();
            expect(json.accessControlAllowOrigin).toBe("");
            expect(json.rightsGroup["lizmap.tools.displayGetCapabilitiesLinks"].sort()).toStrictEqual(
                [
                    "admins",
                    "anonymous",
                    "group_a",
                    "group_b",
                    "Publishers"
                ].sort()
            );
            expect(json.rightsGroup["lizmap.repositories.view"].sort()).toStrictEqual(
                [
                    "admins",
                    "anonymous",
                    "group_a",
                    "group_b",
                    "Intranet demos group",
                    "lizadmins",
                    "Publishers",
                    "users"
                ].sort()
            );
            expect(json.rightsGroup["lizmap.tools.loginFilteredLayers.override"].sort()).toStrictEqual(
                [
                    "admins",
                    "Publishers"
                ].sort()
            );
            expect(json.rightsGroup["lizmap.tools.layer.export"].sort()).toStrictEqual(
                [
                    "admins",
                    "anonymous",
                    "group_a",
                    "group_b",
                    "Publishers"
                ].sort()
            );
            expect(json.rightsGroup["lizmap.tools.edition.use"].sort()).toStrictEqual(
                [
                    "admins",
                    "anonymous",
                    "group_a",
                    "group_b",
                    "Publishers"
                ].sort()
            );
        });

        test('GET all projects from a specific repository', async ({request}) => {
            const response = await request.get(url + "/repositories/testsrepository/projects",
                {
                    headers: {
                        authorization: 'Basic YWRtaW46YWRtaW4='
                    }
                });

            const json = await checkJson(response);

            expect(json[0].id).toBeDefined();
            expect(json[0].title).toBeDefined();
            expect(json[0].abstract).toBeDefined();
        });

        test('GET a specific project from a specific repository', async ({request}) => {
            const response = await request.get(url + "/repositories/testsrepository/projects/attribute_table",
                {
                    headers: {
                        authorization: 'Basic YWRtaW46YWRtaW4='
                    }
                });

            const json = await checkJson(response);

            expect(json.id).toBe("attribute_table");
            expect(json.title).toBe("attribute_table");
            expect(json.abstract).toBe("");
            expect(json.keywordList).toBe("");
            expect(json.proj).toBe("EPSG:2154");
            expect(json.bbox).toBe("758745.34719999996013939, 6272204.95040000043809414, 782484.37399999995250255, 6286577.87310000043362379");
            expect(json.needsUpdateError).toBeFalsy();
            expect(json.acl).toBeTruthy();
            expect(json.wmsGetCapabilitiesUrl).toBe("http://localhost:8130/index.php/lizmap/service?repository=testsrepository&project=attribute_table&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities");
            expect(json.wmtsGetCapabilitiesUrl).toBe("http://localhost:8130/index.php/lizmap/service?repository=testsrepository&project=attribute_table&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities");
        });
    }
);
