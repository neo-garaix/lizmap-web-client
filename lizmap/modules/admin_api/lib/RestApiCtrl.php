<?php

namespace LizmapApi;

class RestApiCtrl extends \jController implements \jIRestController
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

        return Error::setError($rep, 501);
    }

    /**
     * Handles the creation of a new repository based on provided parameters.
     *
     * @return object a JSON response object containing the repository details and a success flag indicating if the repository was successfully created
     */
    public function post(): object
    {
        $rep = $this->getResponse('json');

        return Error::setError($rep, 501);
    }

    public function put()
    {
        $rep = $this->getResponse('json');

        return Error::setError($rep, 501);
    }

    public function delete()
    {
        $rep = $this->getResponse('json');

        return Error::setError($rep, 501);
    }
}
