<?php

use LizmapApi\ErrorHttp;

class error_pageCtrl extends jController
{

    /**
     * Retrieves a JSON response that sets a basic authentication error page
     * using ErrorHttp.
     *
     * @return object The JSON response filled with a basic authentication error.
     */
    function index(): object
    {
        $rep = $this->getResponse('json');

        return ErrorHttp::setBasicAuthErrorPage($rep);
    }
}
