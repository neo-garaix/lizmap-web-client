<?php

/**
 * @author    3liz.com
 * @copyright 2011-2025 3Liz
 *
 * @see      https://3liz.com
 *
 * @license   https://www.mozilla.org/MPL/ Mozilla Public Licence
 */

use LizmapApi\Credentials;
use LizmapApi\Error;
use LizmapApi\RestApiCtrl;

class project_restCtrl extends RestApiCtrl
{
    public function get(): object
    {

        $rep = $this->getResponse('json');

        if (!Credentials::handle()) {
            return Error::setError($rep, 401);
        }

        try {
            $repo = lizmap::getRepository($this->param('repo'));

            if ($repo == null) {
                throw new Exception(code: 404);
            }
        } catch (Throwable $e) {
            return Error::setError($rep, $e->getCode());
        }

        if ($this->param('proj') != null) {

            try {
                $proj = $repo->getProject($this->param('proj'));
            } catch (Throwable $e) {
                return Error::setError($rep, 404, $e->getMessage());
            }

            $response = array(
                'id' => $proj->getKey(),
                'title' => $proj->getTitle(),
                'abstract' => $proj->getAbstract(),
                'keywordList' => $proj->getKeywordsList(),
                'proj' => $proj->getProj(),
                'bbox' => $proj->getBbox(),
                'needsUpdateError' => $proj->needsUpdateError(),
                'acl' => $proj->checkAcl(),
                'wmsGetCapabilitiesUrl' => $proj->getWMSGetCapabilitiesUrl(),
                'wmtsGetCapabilitiesUrl' => $proj->getWMTSGetCapabilitiesUrl(),
            );
        } else {
            $projs = $repo->getProjectsMainData();

            $response = array();

            foreach ($projs as $proj) {
                $response[] = array(
                    'id' => $proj->getId(),
                    'title' => $proj->getTitle(),
                    'abstract' => $proj->getAbstract(),
                );
            }
        }

        // @phpstan-ignore-next-line
        $rep->data = $response;

        return $rep;
    }
}
