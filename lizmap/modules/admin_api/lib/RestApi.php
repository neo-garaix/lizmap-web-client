<?php

namespace LizmapApi;

use jController;
use jIRestController;

class RestApi extends jController implements jIRestController {

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

        return ErrorHttp::setError($rep);
    }

    /**
     * Handles the creation of a new repository based on provided parameters.
     *
     * @return object A JSON response object containing the repository details and a success flag indicating if the repository was successfully created.
     */
    function post(): object
    {
        $rep = $this->getResponse('json');

        return ErrorHttp::setError($rep);
    }

    function put(){
        $rep = $this->getResponse('json');

        return ErrorHttp::setError($rep);
    }

    function delete(){
        $rep = $this->getResponse('json');

        return ErrorHttp::setError($rep);
    }

}
