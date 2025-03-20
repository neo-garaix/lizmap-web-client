<?php

/**
 * @author    3liz.com
 * @copyright 2011-2025 3Liz
 *
 * @see      https://3liz.com
 *
 * @license   https://www.mozilla.org/MPL/ Mozilla Public Licence
 */

use LizmapAdmin\RepositoryRightsService;
use LizmapApi\Credentials;
use LizmapApi\Error;
use LizmapApi\RestApiCtrl;
use LizmapApi\Utils;

class repository_restCtrl extends RestApiCtrl
{
    /**
     * Retrieves repository information and rights based on the provided parameters.
     * If a specific repository is requested, detailed information and user rights are returned.
     * Otherwise, a list of available repositories and their basic information is returned.
     *
     * @return object a JSON response object containing repository or repositories data and rights if applicable
     */
    public function get(): object
    {

        $rep = $this->getResponse('json');

        if (!Credentials::handle()) {
            return Error::setError($rep, 401);
        }

        if ($this->param('repo') != null) {

            try {
                $repo = lizmap::getRepository($this->param('repo'));

                if ($repo == null) {
                    throw new Exception(code: 404);
                }

                $referer = $this->request->header('Referer');

                $cnx = jDb::getConnection('jacl2_profile');

                $rights = RepositoryRightsService::getRights($cnx, $repo->getKey());

                $response = array(
                    'key' => $repo->getKey(),
                    'label' => $repo->getLabel(),
                    'path' => Utils::getLastPartPath($repo->getOriginalPath()),
                    'allowUserDefinedThemes' => $repo->allowUserDefinedThemes(),
                    'accessControlAllowOrigin' => $repo->getACAOHeaderValue($referer),
                    'rightsGroup' => $rights,
                );
            } catch (Throwable $e) {
                return Error::setError($rep, $e->getCode());
            }

        } else {
            $listRepo = lizmap::getRepositoryList();

            $response = array();

            for ($i = 0; $i < count($listRepo); ++$i) {
                $repo = lizmap::getRepository($listRepo[$i]);
                $response[] = array(
                    'key' => $repo->getKey(),
                    'label' => $repo->getLabel(),
                    'path' => Utils::getLastPartPath($repo->getOriginalPath()),
                );
            }
        }

        // @phpstan-ignore-next-line
        $rep->data = $response;

        return $rep;
    }
}
