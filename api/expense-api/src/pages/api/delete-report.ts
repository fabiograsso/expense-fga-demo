import { deleteExpenseReport } from '@/utils/db_utils';
import { NextApiRequest, NextApiResponse } from 'next';
import { getFGAJWT } from '@/utils/token_utils';
import { FGACheckTuple, FGADeleteTuple } from '@/utils/fga_utils';
import { checkTuple, deleteTuple } from '@/utils/fga_utils';
import { getEmailFromHeaders, getUserIdFromHeaders } from '@/utils/header_utils';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const { report_id } = req.body;
    const submitter_email = getEmailFromHeaders(req.headers);
    const submitter_id = getUserIdFromHeaders(req.headers);

    try {
        const fga_payload: FGACheckTuple = {
            user: `employee:${submitter_id}`,
            relation: 'submitter',
            object: `report:${report_id}`
        }
    
        const fga_token = await getFGAJWT();

        if (fga_payload && fga_token) {
    
            const fga_result = await checkTuple(fga_token, fga_payload);
            // if allowed ...
            if (fga_result.allowed) {
                // delete expense report from DB
                const db_result = await deleteExpenseReport({ report_id });

                // If rows are successfully deleted - delete tuple from FGA
                if (Number(db_result[0].numDeletedRows) === 1) {
                    return res.status(200).json({
                        message: `Report ID: ${report_id} was successfully deleted by ${submitter_email}.`
                    })
                    // await deleteTuple(fga_token, fga_payload as FGADeleteTuple);
                    // return res.status(201).json({
                    //     success: true,
                    //     message: `Expense report ${report_id} has been deleted.`,
                    //     result: db_result
                    // });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Bad request - db failed`,
                        result: db_result
                    });
                }
            } else {
                return res.status(401).json({
                    success: false,
                    message: `Unauthorized`,
                });
            }
        } else {
            return res.status(418).json({boof: 'boof'})
        } 
    } catch (e) {
        return res.status(400).json({
            success: false,
            message: 'Bad Request',
            result: e
        });
    }
};