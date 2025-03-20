<?php
/**
 * @package   lizmap
 * @subpackage admin_api
 * @author    3liz.com
 * @copyright 2011-2025 3Liz
 * @link      https://3liz.com
 * @license   https://www.mozilla.org/MPL/ Mozilla Public Licence
 */

use LizmapAdmin\RepositoryRightsService;
use LizmapApi\RestApi;
use LizmapApi\Credentials;
use LizmapApi\Utils;

class restCtrl extends RestApi {

    /**
     * Retrieves repository information and rights based on the provided parameters.
     * If a specific repository is requested, detailed information and user rights are returned.
     * Otherwise, a list of available repositories and their basic information is returned.
     *
     * @return object A JSON response object containing repository or repositories data and rights if applicable.
     */
    function get(): object
    {

        $rep = $this->getResponse('json');

        if (!Credentials::handle()) {
            return $this->redirectToErrorPage();
        }

        if ($this->param('repo') != null) {
            $repo = lizmap::getRepository($this->param('repo'));

            $referer = $this->request->header('Referer');

            $cnx = jDb::getConnection('jacl2_profile');

            $rights = RepositoryRightsService::getRights($cnx, $repo->getKey());

            $response = array(
                'key' => $repo->getKey(),
                'label' => $repo->getLabel(),
                'path' => Utils::getRelativePath($repo->getOriginalPath()),
                'allowUserDefinedThemes' => $repo->getData('allowUserDefinedThemes'),
                'accessControlAllowOrigin' => $repo->getACAOHeaderValue($referer),
                'rightsGroup' => $rights,
            );
        } else {
            $listRepo = lizmap::getRepositoryList();

            $response = array();

            for ($i = 0; $i < count($listRepo); $i++) {
                $repo = lizmap::getRepository($listRepo[$i]);
                $response[] = array(
                    'key' => $repo->getKey(),
                    'label' => $repo->getLabel(),
                    'path' => Utils::getRelativePath($repo->getOriginalPath()),
                );
            }
        }

        $rep->data = $response;

        return $rep;
    }

    /**
     * Redirects the user to the predefined error page.
     *
     * @return object The response object configured for redirection.
     */
    protected function redirectToErrorPage(): object
    {
        $rep = $this->getResponse('redirect');
        $rep->action = "admin_api~error_page:index";
        return $rep;
    }
}
